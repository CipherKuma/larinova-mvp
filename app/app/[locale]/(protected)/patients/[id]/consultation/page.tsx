"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TranscriptionView } from "@/components/consultation/TranscriptionView";
import { ConsultationResults } from "@/components/consultation/ConsultationResults";
import FreeTierExhaustedModal from "@/components/free-tier-exhausted-modal";
import { CheckCircle, Loader2 } from "lucide-react";

interface Consultation {
  id: string;
  consultation_code: string;
  start_time: string;
  status: string;
  patient: {
    id: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    phone_number: string;
  };
  doctor: {
    id: string;
    full_name: string;
  };
}

interface Transcript {
  id: string;
  speaker: "doctor" | "patient" | "unknown";
  text: string;
  translation?: string;
  confidence: number;
  timestamp_start: number;
  timestamp_end: number;
  created_at: string;
}

interface GenerationSteps {
  recording: boolean;
  diarization: boolean;
  transcript: boolean;
  summary: boolean;
  codes: boolean;
  soap: boolean;
}

interface Results {
  transcripts: Transcript[];
  summary: string | null;
  medicalCodes: any | null | undefined; // undefined = still loading in background
  soapNote: string | null;
}

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = use(params);
  const router = useRouter();
  const routeParams = useParams();
  const t = useTranslations();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState<{
    used: number;
    limit: number;
  } | null>(null);

  const [consultationPhase, setConsultationPhase] = useState<
    "recording" | "generating" | "results"
  >("recording");
  const [generationSteps, setGenerationSteps] = useState<GenerationSteps>({
    recording: false,
    diarization: false,
    transcript: false,
    summary: false,
    codes: false,
    soap: false,
  });
  const [results, setResults] = useState<Results | null>(null);

  const startConsultation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/consultations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (response.status === 402) {
        const payload = await response.json().catch(() => ({}));
        setExhausted({
          used: typeof payload.used === "number" ? payload.used : 0,
          limit: typeof payload.limit === "number" ? payload.limit : 20,
        });
        return;
      }
      if (!response.ok)
        throw new Error(t("consultations.failedToStartConsultation"));
      const data = await response.json();
      setConsultation(data.consultation);
    } catch (err) {
      console.error("Error starting consultation:", err);
      setError(t("consultations.failedToStartTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startConsultation();
  }, [patientId]);

  const handleDiarizationComplete = async (consultationId: string) => {
    setConsultationPhase("generating");
    setGenerationSteps((prev) => ({
      ...prev,
      recording: true,
      diarization: true,
    }));

    // Fire transcript, summary, and SOAP in parallel
    const transcriptPromise = fetch(
      `/api/consultations/${consultationId}/transcripts`,
    )
      .then((r) => r.json())
      .then((data) => {
        setGenerationSteps((prev) => ({ ...prev, transcript: true }));
        return data;
      })
      .catch((e) => {
        console.error("Transcript fetch error:", e);
        return { transcripts: [] };
      });

    const summaryPromise = fetch(
      `/api/consultations/${consultationId}/summary`,
      { method: "POST" },
    )
      .then((r) => r.json())
      .then((data) => {
        setGenerationSteps((prev) => ({ ...prev, summary: true }));
        return data;
      })
      .catch((e) => {
        console.error("Summary gen error:", e);
        return { summary: null };
      });

    const soapPromise = fetch(
      `/api/consultations/${consultationId}/soap-note`,
      { method: "POST" },
    )
      .then((r) => r.json())
      .then((data) => {
        setGenerationSteps((prev) => ({ ...prev, soap: true }));
        return data;
      })
      .catch((e) => {
        console.error("SOAP gen error:", e);
        return { soapNote: null };
      });

    const [transcriptRes, summaryRes, soapRes] = await Promise.allSettled([
      transcriptPromise,
      summaryPromise,
      soapPromise,
    ]);

    const soapNote =
      soapRes.status === "fulfilled" ? soapRes.value.soapNote || null : null;
    const summary =
      summaryRes.status === "fulfilled"
        ? summaryRes.value.summary || null
        : null;

    // Show results immediately — medical codes load in background
    const initialResults: Results = {
      transcripts:
        transcriptRes.status === "fulfilled"
          ? transcriptRes.value.transcripts || []
          : [],
      summary,
      medicalCodes: undefined, // Loading
      soapNote,
    };
    setResults(initialResults);
    setConsultationPhase("results");

    // Extract chief complaint from SOAP note's Subjective section
    let chiefComplaint: string | undefined;
    if (soapNote) {
      const ccMatch = soapNote.match(/Chief\s+Complaint[:\s]*([^\n]+)/i);
      if (ccMatch) {
        chiefComplaint = ccMatch[1].replace(/\*+/g, "").trim();
      }
    }

    // End consultation immediately (doesn't need codes)
    fetch(`/api/consultations/${consultationId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chief_complaint: chiefComplaint, summary }),
    }).catch((e) => console.error("Failed to end consultation:", e));

    // Generate medical codes in background, then create documents
    if (soapNote) {
      fetch(`/api/consultations/${consultationId}/medical-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soapNote }),
      })
        .then((r) => r.json())
        .then((codesData) => {
          const medicalCodes = codesData.medicalCodes || null;
          setGenerationSteps((prev) => ({ ...prev, codes: true }));
          setResults((prev) => (prev ? { ...prev, medicalCodes } : prev));
          return fetch(
            `/api/consultations/${consultationId}/create-documents`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ summary, soapNote, medicalCodes }),
            },
          );
        })
        .catch((e) => {
          console.error("Medical codes/documents error:", e);
          setGenerationSteps((prev) => ({ ...prev, codes: true }));
          setResults((prev) => (prev ? { ...prev, medicalCodes: null } : prev));
          // Still create documents without codes
          fetch(`/api/consultations/${consultationId}/create-documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary, soapNote, medicalCodes: null }),
          }).catch(() => {});
        });
    } else {
      setGenerationSteps((prev) => ({ ...prev, codes: true }));
      setResults((prev) => (prev ? { ...prev, medicalCodes: null } : prev));
      fetch(`/api/consultations/${consultationId}/create-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, soapNote: null, medicalCodes: null }),
      }).catch(() => {});
    }
  };

  const exhaustedModal = (
    <FreeTierExhaustedModal
      open={exhausted !== null}
      onOpenChange={(v) => {
        if (!v) setExhausted(null);
      }}
      used={exhausted?.used ?? 0}
      limit={exhausted?.limit ?? 20}
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {exhaustedModal}
        <div className="glass-card-strong p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
          <div className="text-lg font-semibold mb-2 text-foreground">
            {t("consultations.startingConsultation")}
          </div>
          <div className="text-sm text-muted-foreground">
            {t("consultations.pleaseWait")}
          </div>
        </div>
      </div>
    );
  }

  if (exhausted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {exhaustedModal}
        <div className="glass-card-strong p-8 text-center">
          <div className="text-lg font-semibold mb-4 text-foreground">
            Free tier limit reached
          </div>
          <Button onClick={() => router.push(`/patients/${patientId}` as any)}>
            {t("patients.backToPatient")}
          </Button>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card-strong p-8 text-center">
          <div className="text-lg font-semibold mb-4 text-foreground">
            {error || t("consultations.failedToStartConsultation")}
          </div>
          <Button onClick={() => router.push(`/patients/${patientId}` as any)}>
            {t("patients.backToPatient")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="glass-card-strong p-6 border-l-4 border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("consultations.consultationSession")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isRecording && consultationPhase === "recording" && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-semibold text-sm text-foreground">
                  {t("consultations.recording")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Info Card */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t("consultations.startTime")}
            </div>
            <div className="font-semibold text-sm text-foreground">
              {new Date(consultation.start_time).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t("consultations.patient")}
            </div>
            <div className="font-semibold text-sm text-foreground">
              {consultation.patient.full_name}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t("consultations.doctor")}
            </div>
            <div className="font-semibold text-sm text-foreground">
              {consultation.doctor.full_name}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {t("common.status")}
            </div>
            <div className="font-semibold text-sm text-foreground capitalize">
              {consultationPhase === "results"
                ? "completed"
                : consultation.status.replace(/_/g, " ")}
            </div>
          </div>
        </div>
      </div>

      {/* Phase: Recording */}
      {consultationPhase === "recording" && (
        <TranscriptionView
          consultationId={consultation.id}
          isRecording={isRecording}
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={() => setIsRecording(false)}
          transcripts={transcripts}
          onTranscriptUpdate={setTranscripts}
          onDiarizationComplete={handleDiarizationComplete}
        />
      )}

      {/* Phase: Generating */}
      {consultationPhase === "generating" && (
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            {t("consultation.generatingDocumentation")}
          </h2>
          {[
            {
              key: "recording" as const,
              label: t("consultation.recordingComplete"),
            },
            {
              key: "diarization" as const,
              label: t("consultation.speakerIdComplete"),
            },
            {
              key: "transcript" as const,
              label: t("consultation.formattingTranscript"),
            },
            {
              key: "summary" as const,
              label: t("consultation.generatingAiSummary"),
            },
            {
              key: "codes" as const,
              label: t("consultation.generatingMedCodes"),
            },
            { key: "soap" as const, label: t("consultation.generatingSoap") },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              {generationSteps[key] ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
              <span
                className={
                  generationSteps[key]
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Phase: Results */}
      {consultationPhase === "results" && results && (
        <ConsultationResults
          transcripts={results.transcripts}
          summary={results.summary}
          medicalCodes={results.medicalCodes}
          soapNote={results.soapNote}
          consultationId={consultation.id}
          patientId={patientId}
        />
      )}
    </div>
  );
}
