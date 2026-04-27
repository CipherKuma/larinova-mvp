import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Error types for better error handling
type SignupErrorType =
  | "USER_ALREADY_EXISTS"
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "PROFILE_CREATION_FAILED"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

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

    // 1. Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // Check for specific error types
      let errorType: SignupErrorType = "UNKNOWN_ERROR";
      let errorMessage = authError.message;

      // User already exists
      if (
        authError.message?.toLowerCase().includes("already") ||
        authError.message?.toLowerCase().includes("duplicate") ||
        authError.code === "user_already_exists"
      ) {
        errorType = "USER_ALREADY_EXISTS";
        errorMessage = "An account with this email already exists";
      }
      // Invalid email format
      else if (
        authError.message?.toLowerCase().includes("email") ||
        authError.message?.toLowerCase().includes("invalid")
      ) {
        errorType = "INVALID_EMAIL";
        errorMessage = "Please enter a valid email address";
      }
      // Weak password
      else if (
        authError.message?.toLowerCase().includes("password") ||
        authError.message?.toLowerCase().includes("weak")
      ) {
        errorType = "WEAK_PASSWORD";
        errorMessage = "Password must be at least 8 characters long";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          errorType,
          originalError: authError.message,
        },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          error: "Failed to create user account",
          errorType: "UNKNOWN_ERROR" as SignupErrorType,
        },
        { status: 400 },
      );
    }

    // 2. Create doctor profile (service role bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

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
        user_id: authData.user.id,
        email,
        first_name: computedFirst,
        last_name: computedLast,
        full_name: fullName, // trigger keeps this in sync going forward
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
      const cookieStore = await import("next/headers").then((m) => m.cookies());
      const code = (await cookieStore).get("larinova_invite_token")?.value;
      if (code) {
        await supabase.rpc("claim_invite_code", { p_code: code.toUpperCase() });
      }
    } catch (err) {
      console.error("[signup] claim_invite_code failed:", err);
      // Non-fatal — proxy will bounce the user to /access on next nav.
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
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
