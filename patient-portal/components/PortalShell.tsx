import type { ReactNode } from "react";
import PortalHeader from "./PortalHeader";
import Footer from "./Footer";

export default function PortalShell({
  email,
  name,
  children,
}: {
  email: string;
  name?: string | null;
  children: ReactNode;
}) {
  return (
    <>
      <PortalHeader email={email} name={name} />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
