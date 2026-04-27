import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HealthRecordsView from "@/components/patients/HealthRecordsView";
import ConsultationsView from "@/components/patients/ConsultationsView";
import PrescriptionsView from "@/components/patients/PrescriptionsView";
import { PatientNarrativeCard } from "@/components/patients/patient-narrative-card";
import { FollowUpThreadView } from "@/components/patients/follow-up-thread-view";
import { AskAIFab } from "@/components/patients/ask-ai-fab";
import { Link } from "@/src/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Calendar, Activity } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const supabase = await createClient();
  const t = await getTranslations();

  const { data: patient, error } = await supabase
    .from("larinova_patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    notFound();
  }

  const patientData = patient as Patient;

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <div className="relative space-y-3 md:space-y-6 pb-24">
      {/* AI Narrative */}
      <PatientNarrativeCard patientId={id} />

      {/* Header Card */}
      <div className="glass-card-strong p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <User className="w-6 h-6 md:w-8 md:h-8 text-foreground shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
                  {patientData.full_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {patientData.patient_code}
                  </Badge>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {patientData.gender}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  {calculateAge(patientData.date_of_birth)}{" "}
                  {t("patients.yearsOld")}
                </span>
              </div>
              {patientData.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{patientData.phone}</span>
                </div>
              )}
              {patientData.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{patientData.email}</span>
                </div>
              )}
              {patientData.address && (
                <div className="flex items-start gap-2 text-muted-foreground md:col-span-2 lg:col-span-3">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>
                    {patientData.address}
                    {patientData.city && `, ${patientData.city}`}
                    {patientData.state && `, ${patientData.state}`}
                    {patientData.postal_code && ` ${patientData.postal_code}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Link
            href={`/patients/${id}/consultation`}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm hover:bg-primary/90 hover:shadow-md transition-all duration-200 min-h-[44px]"
          >
            <Activity className="w-4 h-4" />
            {t("patients.newConsultation")}
          </Link>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="glass-card-strong overflow-hidden">
        <Tabs defaultValue="health-records" className="w-full">
          <TabsList className="w-full bg-secondary p-1 h-auto border-b border-border rounded-none justify-start gap-1 overflow-x-auto md:overflow-visible flex-nowrap">
            <TabsTrigger
              value="health-records"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm px-3 py-2 min-h-[40px] shrink-0"
            >
              {t("patients.healthRecords")}
            </TabsTrigger>
            <TabsTrigger
              value="consultations"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm px-3 py-2 min-h-[40px] shrink-0"
            >
              {t("patients.consultations")}
            </TabsTrigger>
            <TabsTrigger
              value="prescriptions"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm px-3 py-2 min-h-[40px] shrink-0"
            >
              {t("patients.prescriptions")}
            </TabsTrigger>
            <TabsTrigger
              value="follow-ups"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm px-3 py-2 min-h-[40px] shrink-0"
            >
              Follow-ups
            </TabsTrigger>
          </TabsList>

          <div className="p-4 md:p-6">
            <TabsContent value="health-records" className="mt-0">
              <HealthRecordsView patientId={id} />
            </TabsContent>

            <TabsContent value="consultations" className="mt-0">
              <ConsultationsView patientId={id} />
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-0">
              <PrescriptionsView patientId={id} />
            </TabsContent>

            <TabsContent value="follow-ups" className="mt-0">
              <FollowUpThreadView patientId={id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <AskAIFab patientId={id} />
    </div>
  );
}
