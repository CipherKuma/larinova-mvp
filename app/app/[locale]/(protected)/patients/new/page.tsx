"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewPatientPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    blood_group: "",
    address: "",
  });
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        throw new Error(t("patients.fullNameRequired"));
      }

      if (!formData.email.trim()) {
        throw new Error(t("patients.emailRequired"));
      }

      if (!dateOfBirth) {
        throw new Error(t("patients.dateOfBirthRequired"));
      }

      if (!formData.gender) {
        throw new Error(t("patients.genderRequired"));
      }

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error(t("patients.notAuthenticated"));
      }

      // Get doctor profile
      const { data: doctor } = await supabase
        .from("larinova_doctors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!doctor) {
        throw new Error(t("patients.doctorProfileNotFound"));
      }

      // Create patient
      const { data, error: insertError } = await supabase
        .from("larinova_patients")
        .insert([
          {
            ...formData,
            date_of_birth: dateOfBirth.toISOString().split("T")[0],
            created_by_doctor_id: doctor.id,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(
          insertError.message || t("patients.failedToCreatePatient"),
        );
      }

      // Redirect to patient detail page
      router.push(`/patients/${data.id}` as any);
    } catch (err) {
      console.error("Error creating patient:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("patients.failedToCreatePatient"),
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="glass-card-strong p-6 border-l-4 border-primary">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("patients.newPatientRegistration")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("patients.fillPatientInfo")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card overflow-hidden">
        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive flex items-start gap-3">
            <span className="font-medium">{t("patients.error")}:</span>
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-8">
          {/* Personal Information */}
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {t("patients.personalInformation")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("patients.personalInfoDesc")}
              </p>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  {t("patients.fullName")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder={t("patients.enterFullName")}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("patients.emailAddress")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t("patients.emailPlaceholder")}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t("patients.phoneNumber")}
                </Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) =>
                    setFormData({ ...formData, phone: value })
                  }
                  placeholder={t("patients.phonePlaceholder")}
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth" className="text-sm font-medium">
                  {t("patients.dateOfBirth")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  date={dateOfBirth}
                  onDateChange={setDateOfBirth}
                  placeholder={t("patients.selectDateOfBirth")}
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-sm font-medium">
                  {t("patients.gender")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  required
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("patients.selectGender")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("patients.male")}</SelectItem>
                    <SelectItem value="female">
                      {t("patients.female")}
                    </SelectItem>
                    <SelectItem value="other">{t("patients.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="blood_group" className="text-sm font-medium">
                  {t("patients.bloodGroup")}
                </Label>
                <Select
                  value={formData.blood_group}
                  onValueChange={(value) =>
                    setFormData({ ...formData, blood_group: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("patients.selectBloodGroup")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {t("patients.addressInformation")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("patients.addressInfoDesc")}
              </p>
            </div>
            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                {t("patients.fullAddress")}
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder={t("patients.addressPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="glass-card-strong px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/patients" as any)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? t("patients.creating") : t("patients.createPatient")}
          </Button>
        </div>
      </form>
    </div>
  );
}
