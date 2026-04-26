"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // PKCE: when arriving from a Supabase verify/magic link, the URL carries
      // ?code=<auth_code>. Exchange it for a session BEFORE getUser, otherwise
      // the session never exists and getUser returns null → endless /sign-in
      // bounce.
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          router.push(
            `/${locale}/sign-in?error=${encodeURIComponent(exchangeError.message)}`,
          );
          return;
        }
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push(`/${locale}/sign-in`);
        return;
      }

      // Check if doctor profile exists
      const { data: doctor } = await supabase
        .from("larinova_doctors")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (!doctor) {
        // New user — create minimal doctor profile, then go to onboarding
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
        router.push(`/${locale}/onboarding`);
      } else if (!doctor.onboarding_completed) {
        router.push(`/${locale}/onboarding`);
      } else {
        router.push(`/${locale}`);
      }
    };

    handleCallback();
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
