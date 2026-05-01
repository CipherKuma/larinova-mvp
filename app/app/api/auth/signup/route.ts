import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Error types for better error handling
type SignupErrorType =
  | "USER_ALREADY_EXISTS"
  | "INVALID_EMAIL"
  | "PROFILE_CREATION_FAILED"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

const CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ServiceClient = ReturnType<typeof createServiceClient<any>>;

async function findAuthUserByEmail(
  serviceClient: ServiceClient,
  email: string,
) {
  const needle = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) return null;
    const found = data.users.find(
      (user) => user.email?.trim().toLowerCase() === needle,
    );
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  return null;
}

function claimIsLockedByAnotherUser(invite: {
  claimed_at: string | null;
  claimed_by_user_id: string | null;
}, userId: string) {
  if (!invite.claimed_by_user_id || !invite.claimed_at) return false;
  if (invite.claimed_by_user_id === userId) return false;
  return Date.now() - new Date(invite.claimed_at).getTime() <= CLAIM_TTL_MS;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;
    const email = String(body.email ?? "").trim().toLowerCase();
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

    const cookieStore = await cookies();
    const inviteCode = cookieStore
      .get("larinova_invite_token")
      ?.value.trim()
      .toUpperCase();

    if (!inviteCode) {
      return NextResponse.json(
        {
          error: "Invite code required. Please use Get Started from your invite email or enter your invite code.",
          errorType: "VALIDATION_ERROR" as SignupErrorType,
        },
        { status: 403 },
      );
    }

    const { data: invite, error: inviteError } = await serviceClient
      .from("larinova_invite_codes")
      .select("code, email, consumed_at, claimed_at, claimed_by_user_id")
      .eq("code", inviteCode)
      .maybeSingle();

    if (
      inviteError ||
      !invite ||
      invite.consumed_at ||
      invite.email?.toLowerCase() !== String(email).trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: "This invite code does not match the email on this signup.",
          errorType: "VALIDATION_ERROR" as SignupErrorType,
        },
        { status: 403 },
      );
    }

    const createDoctorAndBindInvite = async (userId: string) => {
      if (claimIsLockedByAnotherUser(invite, userId)) {
        return {
          ok: false as const,
          status: 409,
          body: {
            error:
              "This invite is already being used. Please use the latest invite email or contact support.",
            errorType: "VALIDATION_ERROR" as SignupErrorType,
          },
        };
      }

      const existingDoctor = await serviceClient
        .from("larinova_doctors")
        .select(
          "id, invite_code_claimed_at, invite_code_redeemed_at, onboarding_completed",
        )
        .eq("user_id", userId)
        .maybeSingle();

      const claimedAt = new Date().toISOString();
      const computedFirst =
        firstName ?? (fullName ? fullName.split(/\s+/)[0] : null);
      const computedLast =
        lastName ??
        (fullName ? fullName.split(/\s+/).slice(1).join(" ") || null : null);

      const doctorResult = existingDoctor.data?.id
        ? await serviceClient
            .from("larinova_doctors")
            .update({
              email,
              first_name: computedFirst,
              last_name: computedLast,
              invite_code_claimed_at:
                existingDoctor.data.invite_code_claimed_at ?? claimedAt,
              ...(phoneNumber ? { phone: phoneNumber } : {}),
            })
            .eq("id", existingDoctor.data.id)
            .select("id")
            .single()
        : await serviceClient
            .from("larinova_doctors")
            .insert({
              user_id: userId,
              email,
              first_name: computedFirst,
              last_name: computedLast,
              specialization: "Not Specified",
              locale: "in",
              onboarding_completed: false,
              invite_code_claimed_at: claimedAt,
              ...(phoneNumber ? { phone: phoneNumber } : {}),
            })
            .select("id")
            .single();
      const createdDoctorRow = !existingDoctor.data?.id;

      if (doctorResult.error || !doctorResult.data?.id) {
        return {
          ok: false as const,
          status: 400,
          body: {
            error: "Failed to create doctor profile. Please contact support.",
            errorType: "PROFILE_CREATION_FAILED" as SignupErrorType,
            originalError: doctorResult.error?.message,
          },
        };
      }

      const inviteUpdate = await serviceClient
        .from("larinova_invite_codes")
        .update({
          claimed_at: claimedAt,
          claimed_by_user_id: userId,
          redeemed_at: claimedAt,
          redeemed_by: userId,
        })
        .eq("code", inviteCode)
        .is("consumed_at", null)
        .select("code")
        .single();

      if (inviteUpdate.error || !inviteUpdate.data) {
        if (createdDoctorRow) {
          await serviceClient
            .from("larinova_doctors")
            .delete()
            .eq("id", doctorResult.data.id);
        } else if (!existingDoctor.data?.invite_code_claimed_at) {
          await serviceClient
            .from("larinova_doctors")
            .update({ invite_code_claimed_at: null })
            .eq("id", doctorResult.data.id);
        }
        return {
          ok: false as const,
          status: 409,
          body: {
            error:
              "We could not bind this invite to your account. Please try again.",
            errorType: "VALIDATION_ERROR" as SignupErrorType,
            originalError: inviteUpdate.error?.message,
          },
        };
      }

      await serviceClient.from("larinova_subscriptions").upsert(
        {
          doctor_id: doctorResult.data.id,
          plan: "pro",
          status: "active",
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          updated_at: claimedAt,
        },
        { onConflict: "doctor_id" },
      );

      return { ok: true as const, doctorId: doctorResult.data.id };
    };

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
      if (m.includes("already") || m.includes("registered")) {
        const existingUser = await findAuthUserByEmail(serviceClient, email);
        if (existingUser?.id) {
          const bindExisting = await createDoctorAndBindInvite(existingUser.id);
          if (!bindExisting.ok) {
            return NextResponse.json(bindExisting.body, {
              status: bindExisting.status,
            });
          }

          const response = NextResponse.json({
            success: true,
            user: {
              id: existingUser.id,
              email: existingUser.email,
            },
          });
          response.cookies.set("larinova_invite_token", "", {
            path: "/",
            maxAge: 0,
          });
          return response;
        }
      }

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

    const bindCreated = await createDoctorAndBindInvite(created.user.id);
    if (!bindCreated.ok) {
      await serviceClient.auth.admin.deleteUser(created.user.id);
      return NextResponse.json(
        bindCreated.body,
        { status: bindCreated.status },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: created.user.id,
        email: created.user.email,
      },
    });
    response.cookies.set("larinova_invite_token", "", { path: "/", maxAge: 0 });
    return response;
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
