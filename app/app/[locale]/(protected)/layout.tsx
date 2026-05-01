import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ClientProviders } from "./ClientProviders";
import { createClient } from "@/lib/supabase/server";
import { getUserShellData } from "@/lib/user-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await params;
  const supabase = await createClient();
  const shell = await getUserShellData(supabase);

  return (
    <ClientProviders>
      {/* Desktop ≥md: side-by-side sidebar + main */}
      {/* Mobile <md: top bar + scrollable content + bottom nav */}
      <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
        <Sidebar
          initialDoctor={shell?.doctor ?? null}
          initialPlan={shell?.plan}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MobileTopBar />
          <main className="mobile-app-content flex-1 overflow-y-auto pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
            <div className="p-4 md:p-3 lg:p-4 xl:p-5 2xl:p-6 md:min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
      <MobileBottomNav
        initialDoctor={shell?.doctor ?? null}
        initialPlan={shell?.plan}
      />
    </ClientProviders>
  );
}
