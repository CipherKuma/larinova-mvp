"use client";

import { useEffect } from "react";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { UserShellProvider } from "@/components/layout/UserShellContext";
import type { UserShellData } from "@/lib/user-shell";

export function ClientProviders({
  initialShell,
  children,
}: {
  initialShell: UserShellData | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("larinova:app-ready"));
  }, []);

  return (
    <UserShellProvider initial={initialShell}>
      <SidebarProvider>{children}</SidebarProvider>
    </UserShellProvider>
  );
}
