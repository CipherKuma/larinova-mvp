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
        // For OAuth callbacks the code MUST be exchanged client-side. For
        // magic-link / OTP flows the session is already set by Supabase's
        // verify endpoint via Set-Cookie, and the code_verifier may not be
        // in this client's storage — we swallow that error and let getUser
        // confirm the session below.
        await supabase.auth.exchangeCodeForSession(code).catch(() => {});
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
        // New user — create minimal doctor profile (name will be captured
        // in onboarding step 1, so don't fabricate one from the email
        // prefix). full_name is intentionally NULL.
        await supabase.from("larinova_doctors").insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name ?? null,
          email: user.email!,
          locale: locale === "id" ? "id" : "in",
          onboarding_completed: false,
        });
      }

      // Claim the invite code now that we're authenticated. Best-effort —
      // the proxy will bounce the user to /access on the next nav if this
      // fails (e.g. cookie expired between code entry and OTP verify).
      await fetch("/api/invite/claim", { method: "POST" }).catch(() => {});

      if (!doctor || !doctor.onboarding_completed) {
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
