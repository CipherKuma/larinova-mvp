import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminSidebar } from "./AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  if (!user) redirect(`/admin/sign-in`);

  return (
    <div className="md:flex min-h-dvh">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
