"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Search, Loader2, Eye } from "lucide-react";
import { useRouter } from "@/src/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import PrescriptionPreview from "./PrescriptionPreview";
import type { PrescriptionData } from "@/lib/prescription/indianPdfTemplate";

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  common_dosages: string[] | null;
}

interface SelectedMedicine extends Medicine {
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  route: string;
  quantity: string;
  foodTiming: string;
}

interface DoctorInfo {
  full_name: string;
  degrees: string | null;
  registration_number: string | null;
  registration_council: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  phone: string | null;
}

interface PatientInfo {
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
}

interface PrescriptionFormProps {
  consultationId: string;
  patientId: string;
  doctorId: string;
  initialDiagnosis: string;
  doctor: DoctorInfo;
  patient: PatientInfo;
}

const ROUTE_OPTIONS = [
  "Oral",
  "Topical",
  "IV",
  "IM",
  "Subcutaneous",
  "Inhalation",
];

const FOOD_TIMING_OPTIONS = [
  "Before food",
  "After food",
  "With food",
  "Empty stomach",
  "No preference",
];

export default function PrescriptionForm({
  consultationId,
  patientId,
  doctorId,
  initialDiagnosis,
  doctor,
  patient,
}: PrescriptionFormProps) {
  const router = useRouter();
  const t = useTranslations("prescriptionForm");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState<
    SelectedMedicine[]
  >([]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // New fields
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
  const [allergyWarnings, setAllergyWarnings] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [showPreview, setShowPreview] = useState(false);

  const searchMedicines = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/medicines/search?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      setSearchResults(data.medicines || []);
    } catch {
      toast.error(t("toastFailedSearch"));
    } finally {
      setIsSearching(false);
    }
  };

  const addMedicine = (medicine: Medicine) => {
    if (selectedMedicines.find((m) => m.id === medicine.id)) {
      toast.error(t("toastAlreadyAdded"));
      return;
    }

    setSelectedMedicines([
      ...selectedMedicines,
      {
        ...medicine,
        dosage: medicine.common_dosages?.[0] || "",
        frequency: "",
        duration: "",
        instructions: "",
        route: "Oral",
        quantity: "",
        foodTiming: "",
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
    setOpen(false);
  };

  const removeMedicine = (medicineId: string) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.id !== medicineId));
  };

  const updateMedicine = (
    medicineId: string,
    field: keyof Omit<SelectedMedicine, keyof Medicine>,
    value: string,
  ) => {
    setSelectedMedicines(
      selectedMedicines.map((m) =>
        m.id === medicineId ? { ...m, [field]: value } : m,
      ),
    );
  };

  const buildPreviewData = (): PrescriptionData => ({
    doctor: {
      full_name: doctor.full_name,
      degrees: doctor.degrees,
      registration_number: doctor.registration_number,
      registration_council: doctor.registration_council,
      clinic_name: doctor.clinic_name,
      clinic_address: doctor.clinic_address,
      phone_number: doctor.phone,
    },
    patient: {
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      phone_number: patient.phone,
    },
    diagnosis,
    allergy_warnings: allergyWarnings || null,
    medicines: selectedMedicines.map((m) => ({
      name: m.name,
      generic_name: m.generic_name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      route: m.route,
      quantity: m.quantity,
      food_timing: m.foodTiming,
      instructions: m.instructions,
    })),
    follow_up_date: followUpDate ? format(followUpDate, "dd/MM/yyyy") : null,
    doctor_notes: doctorNotes || null,
    date: format(new Date(), "dd/MM/yyyy"),
  });

  const handlePreview = () => {
    if (selectedMedicines.length === 0) {
      toast.error(t("toastNoMedicine"));
      return;
    }
    const incompleteMedicine = selectedMedicines.find(
      (m) => !m.dosage || !m.frequency || !m.duration,
    );
    if (incompleteMedicine) {
      toast.error(t("toastIncomplete"));
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (selectedMedicines.length === 0) {
      toast.error(t("toastNoMedicine"));
      return;
    }

    const incompleteMedicine = selectedMedicines.find(
      (m) => !m.dosage || !m.frequency || !m.duration,
    );
    if (incompleteMedicine) {
      toast.error(t("toastIncomplete"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/prescriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId,
          patientId,
          doctorId,
          doctorNotes,
          diagnosis,
          allergyWarnings: allergyWarnings || null,
          followUpDate: followUpDate
            ? format(followUpDate, "yyyy-MM-dd")
            : null,
          medicines: selectedMedicines.map((m) => ({
            medicineId: m.id,
            medicineName: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
            route: m.route,
            quantity: m.quantity ? parseInt(m.quantity) : null,
            foodTiming: m.foodTiming,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("toastFailed"));
      }

      toast.success(t("toastSuccess"));
      router.push(`/consultations/${consultationId}` as any);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toastFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-4">
        <PrescriptionPreview
          data={buildPreviewData()}
          patientEmail={patient.email}
          onBack={() => setShowPreview(false)}
        />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("creatingBtn")}
            </>
          ) : (
            t("confirmBtn")
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">{t("title")}</h2>

      <div className="space-y-6">
        {/* Diagnosis */}
        <div>
          <Label htmlFor="diagnosis">{t("diagnosisLabel")}</Label>
          <Input
            id="diagnosis"
            placeholder={t("diagnosisPlaceholder")}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Allergy Warnings */}
        <div>
          <Label htmlFor="allergy-warnings">{t("allergyLabel")}</Label>
          <Textarea
            id="allergy-warnings"
            placeholder={t("allergyPlaceholder")}
            value={allergyWarnings}
            onChange={(e) => setAllergyWarnings(e.target.value)}
            rows={2}
            className="mt-2"
          />
        </div>

        {/* Medicine Search */}
        <div>
          <Label>{t("searchLabel")}</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between mt-2"
              >
                <span className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  {t("searchTrigger")}
                </span>
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={t("searchInput")}
                  value={searchQuery}
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    searchMedicines(value);
                  }}
                />
                <CommandList>
                  {isSearching && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {!isSearching && searchQuery.length >= 2 && (
                    <CommandEmpty>{t("noMedicines")}</CommandEmpty>
                  )}
                  {!isSearching && searchResults.length > 0 && (
                    <CommandGroup>
                      {searchResults.map((medicine) => (
                        <CommandItem
                          key={medicine.id}
                          onSelect={() => addMedicine(medicine)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{medicine.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {medicine.generic_name} • {medicine.category}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected Medicines */}
        {selectedMedicines.length > 0 && (
          <div className="space-y-4">
            <Label>
              {t("selectedMedicines", { count: selectedMedicines.length })}
            </Label>
            {selectedMedicines.map((medicine) => (
              <div
                key={medicine.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{medicine.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {medicine.generic_name} • {medicine.category}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedicine(medicine.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`route-${medicine.id}`}>
                      {t("routeLabel")}
                    </Label>
                    <Select
                      value={medicine.route}
                      onValueChange={(value) =>
                        updateMedicine(medicine.id, "route", value)
                      }
                    >
                      <SelectTrigger id={`route-${medicine.id}`}>
                        <SelectValue placeholder={t("routeLabel")} />
                      </SelectTrigger>
                      <SelectContent>
                        {ROUTE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`dosage-${medicine.id}`}>
                      {t("dosageLabel")}
                    </Label>
                    <Input
                      id={`dosage-${medicine.id}`}
                      placeholder={t("dosagePlaceholder")}
                      value={medicine.dosage}
                      onChange={(e) =>
                        updateMedicine(medicine.id, "dosage", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`frequency-${medicine.id}`}>
                      {t("frequencyLabel")}
                    </Label>
                    <Input
                      id={`frequency-${medicine.id}`}
                      placeholder={t("frequencyPlaceholder")}
                      value={medicine.frequency}
                      onChange={(e) =>
                        updateMedicine(medicine.id, "frequency", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`duration-${medicine.id}`}>
                      {t("durationLabel")}
                    </Label>
                    <Input
                      id={`duration-${medicine.id}`}
                      placeholder={t("durationPlaceholder")}
                      value={medicine.duration}
                      onChange={(e) =>
                        updateMedicine(medicine.id, "duration", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`quantity-${medicine.id}`}>
                      {t("quantityLabel")}
                    </Label>
                    <Input
                      id={`quantity-${medicine.id}`}
                      placeholder={t("quantityPlaceholder")}
                      value={medicine.quantity}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        updateMedicine(medicine.id, "quantity", v);
                      }}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`food-${medicine.id}`}>
                      {t("foodTimingLabel")}
                    </Label>
                    <Select
                      value={medicine.foodTiming}
                      onValueChange={(value) =>
                        updateMedicine(medicine.id, "foodTiming", value)
                      }
                    >
                      <SelectTrigger id={`food-${medicine.id}`}>
                        <SelectValue placeholder={t("foodTimingLabel")} />
                      </SelectTrigger>
                      <SelectContent>
                        {FOOD_TIMING_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`instructions-${medicine.id}`}>
                    {t("instructionsLabel")}
                  </Label>
                  <Textarea
                    id={`instructions-${medicine.id}`}
                    placeholder={t("instructionsPlaceholder")}
                    value={medicine.instructions}
                    onChange={(e) =>
                      updateMedicine(
                        medicine.id,
                        "instructions",
                        e.target.value,
                      )
                    }
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Follow-up Date */}
        <div>
          <Label>{t("followUpLabel")}</Label>
          <div className="mt-2">
            <DatePicker
              date={followUpDate}
              onDateChange={setFollowUpDate}
              placeholder={t("followUpPlaceholder")}
            />
          </div>
        </div>

        {/* Doctor Notes */}
        <div>
          <Label htmlFor="doctor-notes">{t("doctorNotesLabel")}</Label>
          <Textarea
            id="doctor-notes"
            placeholder={t("doctorNotesPlaceholder")}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            rows={4}
            className="mt-2"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={selectedMedicines.length === 0}
            className="flex-1"
            size="lg"
          >
            <Eye className="mr-2 h-4 w-4" />
            {t("previewBtn")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedMedicines.length === 0}
            className="flex-1"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("creatingBtn")}
              </>
            ) : (
              t("createBtn")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
