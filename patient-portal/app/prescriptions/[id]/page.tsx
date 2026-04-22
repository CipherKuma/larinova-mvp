import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalHeader from "@/components/PortalHeader";
import PdfDownload from "./PdfDownload";

export const dynamic = "force-dynamic";

type PrescriptionItem = {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

export default async function PrescriptionPage({
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

  const { data: patient } = await supabase
    .from("larinova_patients")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  const { data: rx } = await supabase
    .from("larinova_prescriptions")
    .select(
      "id, prescription_code, doctor_notes, follow_up_date, status, created_at, patient_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!rx) notFound();
  if (patient?.id && rx.patient_id !== patient.id) notFound();

  const { data: items } = await supabase
    .from("larinova_prescription_items")
    .select("id, medicine_name, dosage, frequency, duration, instructions")
    .eq("prescription_id", rx.id);

  return (
    <>
      <PortalHeader email={user.email} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-6 py-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-foreground/60">
            Prescription · {rx.prescription_code}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your medications
          </h1>
          <p className="text-sm text-foreground/70">
            Issued {new Date(rx.created_at).toLocaleDateString()} · Status{" "}
            {rx.status}
          </p>
        </div>

        <section className="space-y-3 rounded-2xl border border-foreground/10 p-5">
          {items && items.length > 0 ? (
            <ul className="space-y-4">
              {(items as PrescriptionItem[]).map((it) => (
                <li key={it.id} className="space-y-1">
                  <p className="text-lg font-medium">{it.medicine_name}</p>
                  <p className="text-sm text-foreground/70">
                    {it.dosage} · {it.frequency} · {it.duration}
                  </p>
                  {it.instructions && (
                    <p className="text-sm text-foreground/60">
                      {it.instructions}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-foreground/70">
              No items on this prescription.
            </p>
          )}
        </section>

        {rx.doctor_notes && (
          <section className="space-y-2 rounded-2xl border border-foreground/10 p-5">
            <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
              Doctor&apos;s notes
            </h2>
            <p className="whitespace-pre-wrap text-base">{rx.doctor_notes}</p>
          </section>
        )}

        <PdfDownload prescriptionId={rx.id} />
      </main>
    </>
  );
}
