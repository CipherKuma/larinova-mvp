"use client";

import { createContext, useContext, ReactNode } from "react";
import type { UserShellData } from "@/lib/user-shell";

const UserShellContext = createContext<UserShellData | null>(null);

export function UserShellProvider({
  initial,
  children,
}: {
  initial: UserShellData | null;
  children: ReactNode;
}) {
  return (
    <UserShellContext.Provider value={initial}>
      {children}
    </UserShellContext.Provider>
  );
}

export function useUserShell(): UserShellData | null {
  return useContext(UserShellContext);
}
