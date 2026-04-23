import { redirect } from "@/src/i18n/routing";
import BillingClient from "./BillingClient";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "id") {
    redirect({ href: "/", locale: "id" });
  }

  return <BillingClient />;
}
