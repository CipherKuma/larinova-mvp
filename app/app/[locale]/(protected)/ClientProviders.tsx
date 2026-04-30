"use client";

import { SidebarProvider } from "@/components/layout/SidebarContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
