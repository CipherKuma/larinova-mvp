import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Error types for better error handling
type SignupErrorType =
  | "USER_ALREADY_EXISTS"
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "PROFILE_CREATION_FAILED"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

const INVITE_COOKIE = "larinova_invite_token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, phoneNumber } = body;
    // Accept either {firstName, lastName} (current sign-up form) or
    // {fullName} (back-compat for any external integration still posting
    // the old shape).
    const firstName: string | undefined = body.firstName?.trim();
    const lastName: string | undefined = body.lastName?.trim();
    const fullNameRaw: string | undefined = body.fullName?.trim();
    const fullName =
      firstName && lastName ? `${firstName} ${lastName}` : fullNameRaw;

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        {
          error: "Please fill in all required fields",
          errorType: "VALIDATION_ERROR" as SignupErrorType,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Check for a valid invite cookie. If the recipient came in via an admin
    // invite, the email was already proven (admin sent the invite to that
    // address; doctor clicked through to set the cookie). In that case we
    // skip Supabase's email confirmation flow — both because it's a slow
    // synchronous SMTP send (5–15s) and because it's a redundant second
    // verification of an already-verified email.
    const cookieStore = await cookies();
    const inviteCode = cookieStore.get(INVITE_COOKIE)?.value;
    let preVerifiedByInvite = false;
    if (inviteCode) {
      const { data: invite } = await serviceClient
        .from("larinova_invite_codes")
        .select("email, consumed_at, redeemed_at")
        .eq("code", inviteCode.toUpperCase())
        .single();
      if (
        invite &&
        !invite.consumed_at &&
        !invite.redeemed_at &&
        typeof invite.email === "string" &&
        invite.email.toLowerCase() === String(email).toLowerCase()
      ) {
        preVerifiedByInvite = true;
      }
    }

    // 1. Create the auth user. Two paths:
    //    a) Pre-verified via invite — service-role admin.createUser with
    //       email_confirm: true. No SMTP send, instant.
    //    b) No invite — fall back to public signUp, which sends the
    //       confirmation email.
    let authUserId: string | null = null;
    let authUserEmail: string | null = null;
    if (preVerifiedByInvite) {
      const { data, error } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data?.user) {
        return mapAuthError(error?.message);
      }
      authUserId = data.user.id;
      authUserEmail = data.user.email ?? email;

      // admin.createUser does NOT establish a session on the SSR Supabase
      // client. Sign in server-side now so cookies are set and the
      // user-scoped RPC `claim_invite_code` (which reads auth.uid()) works.
      // Without this, the invite stays unclaimed and the doctor is stuck
      // on the default free tier instead of getting their pro grant.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        console.error(
          "[signup] post-create signInWithPassword failed:",
          signInErr.message,
        );
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error || !data?.user) {
        return mapAuthError(error?.message, error?.code);
      }
      authUserId = data.user.id;
      authUserEmail = data.user.email ?? email;
    }

    // 2. Create doctor profile (service role bypasses RLS)
    // Compute first/last for the new columns. If the caller supplied them
    // explicitly, use those; otherwise split fullName on first whitespace.
    const computedFirst =
      firstName ?? (fullName ? fullName.split(/\s+/)[0] : null);
    const computedLast =
      lastName ??
      (fullName ? fullName.split(/\s+/).slice(1).join(" ") || null : null);

    const { error: profileError } = await serviceClient
      .from("larinova_doctors")
      .insert({
        user_id: authUserId,
        email,
        first_name: computedFirst,
        last_name: computedLast,
        // full_name is a GENERATED column derived from first/last
        specialization: "Not Specified",
        locale: "in",
        onboarding_completed: false,
        ...(phoneNumber ? { phone: phoneNumber } : {}),
      });

    if (profileError) {
      return NextResponse.json(
        {
          error: "Failed to create doctor profile. Please contact support.",
          errorType: "PROFILE_CREATION_FAILED" as SignupErrorType,
          originalError: profileError.message,
        },
        { status: 400 },
      );
    }

    // Claim the invite code if a token cookie is present. Best-effort —
    // signup with password sets the session immediately, so the user-scoped
    // RPC call below acts on the new auth.uid().
    try {
      if (inviteCode) {
        await supabase.rpc("claim_invite_code", {
          p_code: inviteCode.toUpperCase(),
        });
      }
    } catch (err) {
      console.error("[signup] claim_invite_code failed:", err);
      // Non-fatal — proxy will bounce the user to /access on next nav.
    }

    return NextResponse.json({
      success: true,
      preVerified: preVerifiedByInvite,
      user: {
        id: authUserId,
        email: authUserEmail,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        errorType: "UNKNOWN_ERROR" as SignupErrorType,
        originalError: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function mapAuthError(message: string | undefined, code?: string) {
  let errorType: SignupErrorType = "UNKNOWN_ERROR";
  let errorMessage = message ?? "Failed to create account";
  const m = (message ?? "").toLowerCase();
  if (
    m.includes("already") ||
    m.includes("duplicate") ||
    code === "user_already_exists"
  ) {
    errorType = "USER_ALREADY_EXISTS";
    errorMessage = "An account with this email already exists";
  } else if (m.includes("email") || m.includes("invalid")) {
    errorType = "INVALID_EMAIL";
    errorMessage = "Please enter a valid email address";
  } else if (m.includes("password") || m.includes("weak")) {
    errorType = "WEAK_PASSWORD";
    errorMessage = "Password must be at least 8 characters long";
  }
  return NextResponse.json(
    { error: errorMessage, errorType, originalError: message },
    { status: 400 },
  );
}
