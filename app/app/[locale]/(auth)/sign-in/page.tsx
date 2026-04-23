"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import { sharedAsset } from "@/lib/locale-asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

type Step =
  | "email"
  | "password"
  | "verify-email-otp"
  | "set-password"
  | "phone"
  | "buttons";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const supabase = createClient();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // After successful login, check profile and route accordingly
  const handlePostLogin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();

    if (!doctor) {
      await supabase.from("larinova_doctors").insert({
        user_id: user.id,
        full_name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Doctor",
        email: user.email!,
        locale: locale === "id" ? "id" : "in",
        onboarding_completed: false,
      });
      router.push("/onboarding");
    } else if (!doctor.onboarding_completed) {
      router.push("/onboarding");
    } else {
      toast({
        title: t("welcomeBackToast"),
        description: t("takingToDashboard"),
      });
      router.push("/");
    }
  };

  // Step 1: User enters email, we check if they exist
  const handleEmailContinue = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: t("invalidEmailTitle"),
        description: t("pleaseEnterValidEmail"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { exists, onboardingCompleted } = await res.json();

      if (exists && onboardingCompleted) {
        // Returning user with completed onboarding — ask for password
        setStep("password");
      } else if (exists && !onboardingCompleted) {
        // Existing user but didn't finish onboarding — send magic link to resume
        await sendMagicLink();
      } else {
        // New user — send magic link
        await sendMagicLink();
      }
    } catch {
      toast({
        title: t("unexpectedError"),
        description: t("unexpectedErrorOccurred"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: t("failedToSendLink"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setOtp(Array(6).fill(""));
    setResendTimer(60);
    setStep("verify-email-otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
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
        toast({
          title: t("invalidCode"),
          description: t("invalidOtpDescription"),
          variant: "destructive",
        });
        setOtp(Array(6).fill(""));
        otpRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      await handlePostLogin();
    } catch {
      toast({
        title: t("verificationFailed"),
        description: t("unexpectedErrorOccurred"),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Step 2a: Returning user enters password
  const handlePasswordSubmit = async () => {
    if (!password) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("invalid")) {
          toast({
            title: t("wrongPassword"),
            description: t("invalidCredentials"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("loginFailed"),
            description: error.message,
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      await handlePostLogin();
    } catch {
      toast({
        title: t("loginFailed"),
        description: t("unexpectedErrorOccurred"),
        variant: "destructive",
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
        toast({
          title: t("loginFailed"),
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch {
      toast({
        title: t("loginFailed"),
        description: t("unexpectedErrorOccurred"),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Phone OTP
  const handlePhoneSubmit = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast({
        title: t("invalidEmailTitle"),
        description: t("pleaseEnterValidEmail"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });

      if (error) {
        toast({
          title: t("failedToSendOtp"),
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: t("otpSent"),
        description: t("checkPhoneForCode"),
      });
      router.push(`/verify-otp?phone=${phone}`);
    } catch {
      toast({
        title: t("failedToSendOtp"),
        description: t("unexpectedErrorOccurred"),
        variant: "destructive",
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
            src={sharedAsset("larinova-icon.png")}
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
          {step === "password"
            ? t("welcomeBack")
            : step === "verify-email-otp"
              ? t("checkYourEmail")
              : t("getStartedShort")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {step === "password"
            ? t("enterPasswordToContinue")
            : step === "verify-email-otp"
              ? t("weSentCodeTo", { email })
              : t("aiPoweredTagline")}
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
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
              autoFocus
            />
          </div>
          <Button
            onClick={handleEmailContinue}
            disabled={loading || !email}
            className="w-full"
            size="lg"
          >
            {loading ? t("checking") : tc("continue")}
          </Button>

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

          {/* Phone */}
          <Button
            onClick={() => setStep("phone")}
            variant="outline"
            size="lg"
            className="w-full h-12 text-sm font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            {t("continueWithPhone")}
          </Button>
        </div>
      )}

      {/* Password Step (returning user) */}
      {step === "password" && (
        <div className="space-y-4">
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
                setPassword("");
              }}
              className="ml-auto text-xs text-primary hover:underline flex-shrink-0"
            >
              {t("change")}
            </button>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("password")}
            </label>
            <Input
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              autoFocus
            />
          </div>
          <Button
            onClick={handlePasswordSubmit}
            disabled={loading || !password}
            className="w-full"
            size="lg"
          >
            {loading ? t("signingIn") : t("signIn")}
          </Button>
          <button
            onClick={sendMagicLink}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("forgotPasswordMagicLink")}
          </button>
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
                onClick={sendMagicLink}
                className="text-xs text-primary hover:underline"
              >
                {t("resendCode")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phone Step */}
      {step === "phone" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t("phoneNumber")}
            </label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center rounded-lg border border-border/60 bg-background/50 px-3 text-sm text-muted-foreground h-10">
                +91
              </div>
              <Input
                type="text"
                inputMode="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setPhone(v.slice(0, 10));
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                autoFocus
              />
            </div>
          </div>
          <Button
            onClick={handlePhoneSubmit}
            disabled={loading || phone.length !== 10}
            className="w-full"
            size="lg"
          >
            {loading ? t("sendingOtp") : t("sendOtp")}
          </Button>
          <button
            onClick={() => setStep("email")}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("backToOtherOptions")}
          </button>
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
