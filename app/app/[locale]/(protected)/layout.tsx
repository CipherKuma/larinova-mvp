import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
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
      {/* Desktop ≥md: side-by-side sidebar + main */}
      {/* Mobile <md: top bar + scrollable content + bottom nav */}
      <div className="md:flex md:h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col md:overflow-hidden min-h-screen md:min-h-0">
          <MobileTopBar />
          <main className="flex-1 md:overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
            <div className="p-4 md:p-3 lg:p-4 xl:p-5 2xl:p-6 md:h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </ClientProviders>
  );
}
