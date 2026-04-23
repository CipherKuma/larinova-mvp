import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import AlphaWelcomeBanner from "@/components/alpha-welcome-banner";
import { ClientProviders } from "./ClientProviders";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Verify doctor profile exists
  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctor) {
    redirect("/sign-in");
  }

  return (
    <ClientProviders>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar />
          <AlphaWelcomeBanner />
          <main className="flex-1 overflow-y-auto">
            <div className="p-1.5 md:p-2 lg:p-3 xl:p-4 2xl:p-5 h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ClientProviders>
  );
}
