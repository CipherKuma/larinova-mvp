import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Error types for better error handling
type SignupErrorType =
  | "USER_ALREADY_EXISTS"
  | "INVALID_EMAIL"
  | "PROFILE_CREATION_FAILED"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phoneNumber } = body;
    // Accept either {firstName, lastName} (current sign-up form) or
    // {fullName} (back-compat for any external integration still posting
    // the old shape).
    const firstName: string | undefined = body.firstName?.trim();
    const lastName: string | undefined = body.lastName?.trim();
    const fullNameRaw: string | undefined = body.fullName?.trim();
    const fullName =
      firstName && lastName ? `${firstName} ${lastName}` : fullNameRaw;

    // Validation. Password is no longer accepted — all auth is via email
    // OTP / OAuth. Doctors are created with no password and prove email
    // ownership by entering the 6-digit OTP on /verify-otp.
    if (!email || !fullName) {
      return NextResponse.json(
        {
          error: "Please fill in all required fields",
          errorType: "VALIDATION_ERROR" as SignupErrorType,
        },
        { status: 400 },
      );
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Create the auth user with no password. email_confirm: true skips
    // Supabase's confirmation email — for invite-gated signup the email is
    // already proven (admin sent the invite; doctor clicked through). For
    // non-invite signup we still mark confirmed because the very next step
    // is an email OTP, which provides equivalent proof.
    const { data: created, error: createErr } =
      await serviceClient.auth.admin.createUser({
        email,
        email_confirm: true,
      });
    if (createErr || !created?.user) {
      const m = (createErr?.message ?? "").toLowerCase();
      let errorType: SignupErrorType = "UNKNOWN_ERROR";
      let errorMessage = createErr?.message ?? "Failed to create account";
      if (m.includes("already") || m.includes("registered")) {
        errorType = "USER_ALREADY_EXISTS";
        errorMessage = "An account with this email already exists";
      } else if (m.includes("invalid") || m.includes("email")) {
        errorType = "INVALID_EMAIL";
        errorMessage = "Please enter a valid email address";
      }
      return NextResponse.json(
        { error: errorMessage, errorType, originalError: createErr?.message },
        { status: 400 },
      );
    }

    // Create doctor profile (service role bypasses RLS). Compute first/last
    // for the new columns. If the caller supplied them explicitly, use those;
    // otherwise split fullName on first whitespace.
    const computedFirst =
      firstName ?? (fullName ? fullName.split(/\s+/)[0] : null);
    const computedLast =
      lastName ??
      (fullName ? fullName.split(/\s+/).slice(1).join(" ") || null : null);

    const { error: profileError } = await serviceClient
      .from("larinova_doctors")
      .insert({
        user_id: created.user.id,
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

    // Note: invite claim happens AFTER the doctor verifies their OTP, in the
    // /verify-otp post-verify handler (which calls /api/invite/claim under
    // the now-authenticated session). It can't run here — the user has no
    // session yet, and claim_invite_code requires auth.uid().
    return NextResponse.json({
      success: true,
      user: {
        id: created.user.id,
        email: created.user.email,
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
