"use client";

import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/routing";

interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  email: string;
  date_of_birth: string;
  blood_group: string;
  phone?: string;
  gender?: string;
}

interface PatientTableProps {
  patients: Patient[];
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export function PatientTable({ patients }: PatientTableProps) {
  const t = useTranslations("patients");
  const router = useRouter();

  if (patients.length === 0) {
    return (
      <div className="p-12 text-center">
        <Activity className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t("noPatients")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t("tryAdjustingSearch")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: card list */}
      <ul className="md:hidden divide-y divide-border border-y border-border bg-card">
        {patients.map((patient) => (
          <li key={patient.id}>
            <button
              type="button"
              onClick={() => router.push(`/patients/${patient.id}` as any)}
              className="w-full text-left px-4 py-3.5 min-h-[64px] active:bg-muted/40 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground truncate">
                    {patient.full_name}
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] shrink-0"
                  >
                    {patient.patient_code}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground truncate">
                  {calculateAge(patient.date_of_birth)} {t("years")}
                  {patient.gender ? ` · ${patient.gender}` : ""}
                  {patient.blood_group ? ` · ${patient.blood_group}` : ""}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: dense table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr className="border-b border-border">
              <th className="text-left text-sm font-medium text-muted-foreground p-4">
                {t("patientCode")}
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground p-4">
                {t("fullName")}
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground p-4">
                {t("age")}
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground p-4">
                {t("gender")}
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground p-4">
                {t("bloodGroup")}
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground p-4">
                {t("email")}
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="border-b border-border hover:bg-muted cursor-pointer transition-colors"
                onClick={() => router.push(`/patients/${patient.id}` as any)}
              >
                <td className="p-4">
                  <Badge variant="outline" className="font-mono text-xs">
                    {patient.patient_code}
                  </Badge>
                </td>
                <td className="p-4 text-sm font-medium text-foreground">
                  {patient.full_name}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {calculateAge(patient.date_of_birth)} {t("years")}
                </td>
                <td className="p-4 text-sm text-muted-foreground capitalize">
                  {patient.gender || "-"}
                </td>
                <td className="p-4">
                  <Badge variant="secondary">{patient.blood_group}</Badge>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {patient.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
