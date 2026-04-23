"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { createClient } from "@/lib/supabase/client";
import { sharedAsset } from "@/lib/locale-asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const phone = searchParams.get("phone") || "";
  const t = useTranslations();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join("");
    if (token.length !== 6) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token,
        type: "sms",
      });

      if (error) {
        toast({
          title: t("auth.invalidOtp"),
          description: t("auth.invalidOtpDescription"),
          variant: "destructive",
        });
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      toast({
        title: t("auth.welcomeBackToast"),
        description: t("auth.signInSuccessful"),
      });

      router.push("/onboarding");
    } catch {
      toast({
        title: t("auth.unexpectedError"),
        description: t("auth.unexpectedErrorOccurred"),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });

      if (error) {
        toast({
          title: t("auth.unexpectedError"),
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setResendTimer(60);
      toast({
        title: t("auth.otpSent"),
        description: t("auth.otpSentDescription"),
      });
    } catch {
      toast({
        title: t("auth.unexpectedError"),
        description: t("auth.unexpectedErrorOccurred"),
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
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

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {t("auth.verifyOtp")}
        </h2>
        <p className="text-muted-foreground">{t("auth.enterOtp")}</p>
        {phone && (
          <p className="text-sm text-muted-foreground mt-1">+91 {phone}</p>
        )}
      </div>

      <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-xl font-semibold"
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        disabled={loading || otp.join("").length !== 6}
        className="w-full mb-4"
        size="lg"
      >
        {loading ? t("common.loading") : t("auth.verifyOtp")}
      </Button>

      <div className="text-center">
        {resendTimer > 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("auth.resendIn", { seconds: resendTimer })}
          </p>
        ) : (
          <button
            onClick={handleResend}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("auth.resendOtp")}
          </button>
        )}
      </div>
    </div>
  );
}
