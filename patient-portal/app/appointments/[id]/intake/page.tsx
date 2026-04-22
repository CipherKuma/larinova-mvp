import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalHeader from "@/components/PortalHeader";
import IntakeForm from "./IntakeForm";

export const dynamic = "force-dynamic";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: appt } = await supabase
    .from("larinova_appointments")
    .select("id, booker_email, doctor_id, reason")
    .eq("id", id)
    .maybeSingle();

  if (!appt || appt.booker_email !== user.email) notFound();

  // Team NotifyAgents owns `larinova_intake_templates`. Until that migration
  // lands, render a generic fallback form.
  type Template = {
    id: string;
    questions: Array<{ key: string; label: string; type?: string }>;
  };
  let template: Template | null = null;
  try {
    const { data } = await supabase
      .from("larinova_intake_templates")
      .select("id, questions")
      .eq("doctor_id", appt.doctor_id)
      .maybeSingle();
    if (data) {
      template = data as unknown as Template;
    }
  } catch {
    template = null;
  }

  return (
    <>
      <PortalHeader email={user.email} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 py-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-foreground/60">
            Pre-visit intake
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tell your doctor about your symptoms
          </h1>
          <p className="text-sm text-foreground/70">
            Takes about 2 minutes. Everything is optional.
          </p>
        </div>

        {template ? (
          <IntakeForm appointmentId={appt.id} questions={template.questions} />
        ) : (
          <IntakeForm
            appointmentId={appt.id}
            questions={[
              {
                key: "symptoms",
                label: "What symptoms are you experiencing?",
                type: "textarea",
              },
              {
                key: "duration",
                label: "How long have you had them?",
                type: "text",
              },
              {
                key: "medications",
                label: "Any medications you are currently taking?",
                type: "textarea",
              },
              {
                key: "allergies",
                label: "Known allergies?",
                type: "text",
              },
            ]}
          />
        )}
      </main>
    </>
  );
}
