import { redirect } from "@/src/i18n/routing";
import { IntakeTemplateBuilder } from "@/components/intake-template-builder";

export default async function IntakeSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "id") {
    redirect({ href: "/", locale: "id" });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-4 md:py-10 pb-24">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          Intake template
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Patients fill this form when they book an appointment with you. The
          Pre-consult Intake AI reads their answers and prepares a brief for you
          before the consult.
        </p>
      </div>
      <IntakeTemplateBuilder />
    </div>
  );
}
