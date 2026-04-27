import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { sharedAsset } from "@/lib/locale-asset";

export const dynamic = "force-dynamic";

type Params = { locale: string };
type Search = { invite?: string | string[] };

/**
 * Invite entry point. New one-tap invite links go to /api/invite/accept.
 * Direct app visits can still land here through the pre-auth proxy gate, so
 * this page must render a terminal state instead of redirecting back into the
 * protected app. Otherwise /access -> / -> /sign-in -> /access loops.
 * Cases:
 *   - Already-authed doctor → forward to onboarding/home.
 *   - Cookie already set → forward to sign-up.
 *   - ?invite=CODE on this URL (older emails) → forward to /api/invite/accept.
 *   - Anything else → ask them to open the invite email.
 */
export default async function AccessPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const inviteParam = Array.isArray(sp.invite) ? sp.invite[0] : sp.invite;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();
    if (doctor?.onboarding_completed) redirect(`/${locale}`);
    if (doctor) redirect(`/${locale}/onboarding`);
  }

  if (inviteParam) {
    redirect(
      `/api/invite/accept?code=${encodeURIComponent(inviteParam)}&locale=${locale}`,
    );
  }

  const cookieStore = await cookies();
  if (cookieStore.get("larinova_invite_token")?.value) {
    redirect(`/${locale}/sign-up`);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Image
            src={sharedAsset("larinova-icon.png")}
            alt="Larinova"
            width={44}
            height={44}
            className="object-contain"
            priority
          />
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Larinova
          </span>
        </div>
        <div className="mx-auto mb-6 h-px w-16 bg-muted-foreground/30" />
        <h1 className="text-2xl font-semibold">Open your invite email</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Larinova alpha access is invite-only. Use the Get Started link in
          your invitation email to continue.
        </p>
      </div>
    </main>
  );
}
