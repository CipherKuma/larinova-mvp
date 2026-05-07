"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import { sharedAsset } from "@/lib/locale-asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Step = "email" | "verify-email-otp" | "invite-code";
type EmailError = null | "not_recognized" | "pending_invite" | "generic";
type InviteCodeError =
  | null
  | "invalid_or_used_code"
  | "invalid_input"
  | "unknown";
const EMAIL_OTP_STATE_KEY = "larinova.emailOtpSignIn";
const EMAIL_OTP_STATE_TTL_MS = 10 * 60 * 1000;

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendTimer, setResendTimer] = useState(0);
  const [emailError, setEmailError] = useState<EmailError>(null);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeError, setInviteCodeError] = useState<InviteCodeError>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const tAccess = useTranslations("access");
  const supabase = createClient();

  useEffect(() => {
    const saved = readSavedEmailOtpState();
    if (!saved) return;

    setEmail(saved.email);
    setStep("verify-email-otp");
    const elapsedSeconds = Math.floor((Date.now() - saved.sentAt) / 1000);
    setResendTimer(Math.max(0, 60 - elapsedSeconds));
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-verify once 6 digits are present (from typing the last one OR
  // pasting all 6). Avoids an extra click after paste.
  useEffect(() => {
    if (step === "verify-email-otp" && otp.join("").length === 6 && !loading) {
      handleVerifyEmailOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  // After successful login, check profile and route accordingly
  const handlePostLogin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select(
        "onboarding_completed, invite_code_claimed_at, invite_code_redeemed_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    const hasAlphaDoctorAccess = Boolean(
      doctor?.invite_code_claimed_at || doctor?.invite_code_redeemed_at,
    );

    if (!doctor || !hasAlphaDoctorAccess) {
      await supabase.auth.signOut();
      clearSavedEmailOtpState();
      setStep("email");
      setOtp(Array(6).fill(""));
      setEmailError("not_recognized");
      return;
    }

    // Claim the invite code now that we're authenticated. Best-effort.
    await fetch("/api/invite/claim", { method: "POST" }).catch(() => {});
    clearSavedEmailOtpState();

    if (!doctor || !doctor.onboarding_completed) {
      router.push("/onboarding");
    } else {
      toast.success(t("welcomeBackToast"), {
        description: t("takingToDashboard"),
      });
      router.push("/");
    }
  };

  // Step 1: User enters email → always send email OTP. Passwords are no
  // longer used; OAuth (Google) sits next to this on the same screen.
  const handleEmailContinue = async () => {
    setEmailError(null);
    setEmailErrorMessage("");

    if (!email || !email.includes("@")) {
      setEmailError("generic");
      setEmailErrorMessage(t("pleaseEnterValidEmail"));
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const access = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      }).then((res) => res.json());

      if (access?.hasPendingInvite && !access?.exists) {
        setEmailError("pending_invite");
        setEmailErrorMessage("");
        return;
      }

      if (!access?.exists) {
        setEmailError("not_recognized");
        setEmailErrorMessage("");
        return;
      }

      setEmail(normalizedEmail);
      await sendMagicLink(normalizedEmail);
    } catch {
      setEmailError("generic");
      setEmailErrorMessage(t("unexpectedErrorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  // Supabase signals "user not in auth.users" via either
  // err.code === "otp_disabled" or a message containing
  // "Signups not allowed" / "User not found". Treat those as the
  // invite-required branch so we can route the doctor to the access flow
  // instead of surfacing raw Supabase noise.
  const isUnknownUserError = (err: { code?: string; message?: string }) => {
    if (err.code === "otp_disabled") return true;
    const msg = (err.message ?? "").toLowerCase();
    return (
      msg.includes("signups not allowed") ||
      msg.includes("user not found") ||
      msg.includes("not allowed for otp")
    );
  };

  const sendMagicLink = async (emailForOtp = email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: emailForOtp,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });

    if (error) {
      if (isUnknownUserError(error)) {
        setEmailError("not_recognized");
        setEmailErrorMessage("");
      } else {
        setEmailError("generic");
        setEmailErrorMessage(error.message);
      }
      return;
    }

    setOtp(Array(6).fill(""));
    setResendTimer(60);
    setStep("verify-email-otp");
    saveEmailOtpState(emailForOtp);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // Step alt: User redeems an invite code on the same screen instead of
  // navigating to /access. On success we route to /sign-up where the
  // invite cookie pre-fills first name / last name / email.
  const handleInviteCodeSubmit = async () => {
    setInviteCodeError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        setInviteCodeError((body?.error as InviteCodeError) ?? "unknown");
        setLoading(false);
        return;
      }
      router.push(`/sign-up`);
    } catch {
      setInviteCodeError("unknown");
      setLoading(false);
    }
  };

  const inviteCodeErrorText = (e: InviteCodeError): string => {
    switch (e) {
      case "invalid_or_used_code":
        return tAccess("errorInvalid");
      case "invalid_input":
        return tAccess("errorMalformed");
      case "unknown":
        return tAccess("errorUnknown");
      default:
        return "";
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    // handleVerifyEmailOtp will auto-fire via the useEffect below once all
    // 6 digits are present, no explicit call needed here.
  };

  const handleVerifyEmailOtp = async () => {
    const token = otp.join("");
    if (token.length !== 6) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) {
        toast.error(t("invalidCode"), {
          description: t("invalidOtpDescription"),
        });
        setOtp(Array(6).fill(""));
        otpRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      await handlePostLogin();
    } catch {
      toast.error(t("verificationFailed"), {
        description: t("unexpectedErrorOccurred"),
      });
      setLoading(false);
    }
  };

  // Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      });

      if (error) {
        toast.error(t("loginFailed"), {
          description: error.message,
        });
        setLoading(false);
      }
    } catch {
      toast.error(t("loginFailed"), {
        description: t("unexpectedErrorOccurred"),
      });
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Logo */}
      <div className="flex justify-start mb-6">
        <div className="flex items-center gap-2.5">
          <Image
            src={sharedAsset("dark-mode-icon-only.png")}
            alt="Larinova"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
          <span className="font-display font-semibold text-foreground tracking-tight text-2xl">
            Larinova
          </span>
        </div>
      </div>

      {/* Heading */}
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {step === "verify-email-otp"
            ? t("checkYourEmail")
            : step === "invite-code"
              ? t("haveInviteCodeTitle")
              : t("signInTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {step === "verify-email-otp"
            ? t("weSentCodeTo", { email })
            : step === "invite-code"
              ? t("haveInviteCodeSubtitle")
              : t("signInSubtitle")}
        </p>
      </div>

      {/* Email Step (default) */}
      {step === "email" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("email")}
            </label>
            <Input
              type="email"
              placeholder="doctor@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
              aria-invalid={emailError !== null}
              autoFocus
            />
            {emailError === "generic" && emailErrorMessage && (
              <p
                className="mt-1.5 text-xs text-destructive"
                role="alert"
                aria-live="polite"
              >
                {emailErrorMessage}
              </p>
            )}
          </div>

          {emailError === "not_recognized" ||
          emailError === "pending_invite" ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3"
              role="alert"
              aria-live="polite"
            >
              <p className="text-base font-semibold text-foreground">
                {emailError === "pending_invite"
                  ? t("emailPendingInviteTitle")
                  : t("emailNotRecognizedTitle")}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {emailError === "pending_invite"
                  ? t("emailPendingInviteHint")
                  : t("emailNotRecognizedHint")}
              </p>
              {emailError === "not_recognized" && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("emailNotRecognizedRequest")}{" "}
                  <a
                    className="font-medium text-primary hover:underline"
                    href="mailto:gabriel@larinova.com?subject=Larinova%20doctor%20alpha%20access"
                  >
                    gabriel@larinova.com
                  </a>
                  .
                </p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {emailError === "pending_invite"
                  ? t("emailPendingInviteExistingAccess")
                  : t("emailNotRecognizedExistingAccess")}
              </p>
              <div className="flex flex-col gap-2 pt-1">
                {emailError === "not_recognized" && (
                  <Button asChild size="sm" className="w-full">
                    <a href="mailto:gabriel@larinova.com?subject=Larinova%20doctor%20alpha%20access">
                      {t("requestAccessAction")}
                    </a>
                  </Button>
                )}
                {emailError === "pending_invite" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="pending-invite-code"
                      className="text-sm font-medium text-foreground"
                    >
                      {t("inviteCodeLabel")}
                    </label>
                    <Input
                      id="pending-invite-code"
                      name="pending-invite-code"
                      type="text"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder={t("inviteCodePlaceholder")}
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value);
                        if (inviteCodeError) setInviteCodeError(null);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        inviteCode.trim().length >= 6 &&
                        handleInviteCodeSubmit()
                      }
                    />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("inviteCodeNotOtpHint")}
                    </p>
                    {inviteCodeError && (
                      <p
                        className="text-xs text-destructive"
                        role="alert"
                        aria-live="polite"
                      >
                        {inviteCodeErrorText(inviteCodeError)}
                      </p>
                    )}
                    <Button
                      onClick={handleInviteCodeSubmit}
                      disabled={loading || inviteCode.trim().length < 6}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? t("checkingInviteCode") : tc("continue")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setStep("invite-code");
                      setEmailError(null);
                      setEmailErrorMessage("");
                    }}
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    {t("enterInviteCodeAction")}
                  </Button>
                )}
                {emailError !== "pending_invite" && (
                  <Button
                    onClick={() => {
                      setEmail("");
                      setEmailError(null);
                      setEmailErrorMessage("");
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {t("tryDifferentEmailAction")}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Button
              onClick={handleEmailContinue}
              disabled={loading || !email}
              className="w-full"
              size="lg"
            >
              {loading ? t("checking") : tc("continue")}
            </Button>
          )}

          {emailError !== "not_recognized" &&
            emailError !== "pending_invite" && (
            <>
              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">
                    {t("or")}
                  </span>
                </div>
              </div>

              {/* Google */}
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="outline"
                size="lg"
                className="w-full h-12 text-sm font-medium"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t("continueWithGoogle")}
              </Button>
            </>
          )}

          {emailError !== "not_recognized" &&
            emailError !== "pending_invite" && (
            <div className="pt-2 text-center text-sm text-muted-foreground">
              {t("dontHaveAccountQ")}{" "}
              <button
                type="button"
                onClick={() => {
                  setStep("invite-code");
                  setEmailError(null);
                  setEmailErrorMessage("");
                }}
                className="font-medium text-primary hover:underline"
              >
                {t("enterInviteCode")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invite Code Step */}
      {step === "invite-code" && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="invite-code"
              className="text-sm font-medium mb-1.5 block"
            >
              {t("inviteCodeLabel")}
            </label>
            <Input
              id="invite-code"
              name="invite-code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={t("inviteCodePlaceholder")}
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                if (inviteCodeError) setInviteCodeError(null);
              }}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                inviteCode.trim().length >= 6 &&
                handleInviteCodeSubmit()
              }
              autoFocus
            />
            {inviteCodeError && (
              <p
                className="mt-1.5 text-xs text-destructive"
                role="alert"
                aria-live="polite"
              >
                {inviteCodeErrorText(inviteCodeError)}
              </p>
            )}
          </div>
          <Button
            onClick={handleInviteCodeSubmit}
            disabled={loading || inviteCode.trim().length < 6}
            className="w-full"
            size="lg"
          >
            {loading ? t("checkingInviteCode") : tc("continue")}
          </Button>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            {t("alreadyHaveAccountQ")}{" "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setInviteCodeError(null);
              }}
              className="font-medium text-primary hover:underline"
            >
              {t("signInLink")}
            </button>
          </div>
        </div>
      )}

      {/* Email OTP Verification */}
      {step === "verify-email-otp" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm">
            <span className="text-muted-foreground">
              {t("emailColonDisplay")}
            </span>
            <span className="text-foreground font-medium truncate">
              {email}
            </span>
            <button
              onClick={() => {
                setStep("email");
                setOtp(Array(6).fill(""));
                clearSavedEmailOtpState();
              }}
              className="ml-auto text-xs text-primary hover:underline flex-shrink-0"
            >
              {t("change")}
            </button>
          </div>

          <div>
            <label className="text-sm font-medium mb-2.5 block">
              {t("verificationCode")}
            </label>
            <div
              className="flex justify-between gap-2"
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    handleOtpKeyDown(i, e);
                    if (e.key === "Enter" && otp.join("").length === 6)
                      handleVerifyEmailOtp();
                  }}
                  className="w-11 h-12 text-center text-lg font-semibold px-0"
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleVerifyEmailOtp}
            disabled={loading || otp.join("").length !== 6}
            className="w-full"
            size="lg"
          >
            {loading ? t("verifying") : t("verifyAndSignIn")}
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {t("magicLinkNote")}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setStep("email");
                setOtp(Array(6).fill(""));
                clearSavedEmailOtpState();
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("backArrow")}
            </button>
            {resendTimer > 0 ? (
              <span className="text-xs text-muted-foreground">
                {t("resendIn", { seconds: resendTimer })}
              </span>
            ) : (
              <button
                onClick={() => sendMagicLink()}
                className="text-xs text-primary hover:underline"
              >
                {t("resendCode")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Terms */}
      {step !== "verify-email-otp" && (
        <p className="mt-8 text-left text-[11px] text-muted-foreground/60 leading-relaxed">
          {t("byContinuingTerms")}{" "}
          <a
            href="https://larinova.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground transition-colors"
          >
            {t("termsOfService")}
          </a>{" "}
          {t("and")}{" "}
          <a
            href="https://larinova.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground transition-colors"
          >
            {t("privacyPolicy")}
          </a>
        </p>
      )}
    </div>
  );
}

function saveEmailOtpState(email: string) {
  window.sessionStorage.setItem(
    EMAIL_OTP_STATE_KEY,
    JSON.stringify({ email, sentAt: Date.now() }),
  );
}

function readSavedEmailOtpState(): { email: string; sentAt: number } | null {
  try {
    const raw = window.sessionStorage.getItem(EMAIL_OTP_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown; sentAt?: unknown };
    if (typeof parsed.email !== "string" || typeof parsed.sentAt !== "number") {
      clearSavedEmailOtpState();
      return null;
    }
    if (Date.now() - parsed.sentAt > EMAIL_OTP_STATE_TTL_MS) {
      clearSavedEmailOtpState();
      return null;
    }
    return { email: parsed.email, sentAt: parsed.sentAt };
  } catch {
    clearSavedEmailOtpState();
    return null;
  }
}

function clearSavedEmailOtpState() {
  window.sessionStorage.removeItem(EMAIL_OTP_STATE_KEY);
}
