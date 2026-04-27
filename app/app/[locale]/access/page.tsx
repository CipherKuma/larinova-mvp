import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AccessForm } from "./AccessForm";

export const dynamic = "force-dynamic";

type Params = { locale: string };

export default async function AccessPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;

  // If the user already has a valid session and a doctor profile, route them
  // along instead of bouncing them to a code prompt they don't need.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("onboarding_completed, invite_code_redeemed_at")
      .eq("user_id", user.id)
      .single();
    if (doctor?.onboarding_completed) {
      redirect(`/${locale}`);
    }
    if (doctor) {
      redirect(`/${locale}/onboarding`);
    }
  }

  // If a valid invite cookie is already set, skip straight to sign-in
  const cookieStore = await cookies();
  if (cookieStore.get("larinova_invite_token")?.value) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <AccessForm locale={locale} />
      </div>
    </main>
  );
}
