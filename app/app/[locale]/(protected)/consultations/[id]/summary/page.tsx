"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Stethoscope,
  Sparkles,
  ClipboardList,
  Hash,
  ArrowLeft,
  PartyPopper,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { exportToPdf } from "@/lib/pdf/export";

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

interface Consultation {
  id: string;
  consultation_code: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  status: string;
  ai_summary?: string;
  soap_note?: string;
  medical_codes?: MedicalCodes;
  patient: {
    full_name: string;
  };
  doctor: {
    full_name: string;
  };
}

interface MedicalCodes {
  icd10: Array<{ code: string; description: string; confidence: string }>;
  cpt: Array<{ code: string; description: string; confidence: string }>;
  snomed?: Array<{ code: string; description: string; confidence: string }>;
}

export default function ConsultationSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: consultationId } = use(params);
  const router = useRouter();
  const routeParams = useParams();
  const locale = routeParams.locale as string;
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [soapNote, setSoapNote] = useState<string | null>(null);
  const [medicalCodes, setMedicalCodes] = useState<MedicalCodes | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConsultationData();
  }, [consultationId]);

  const loadConsultationData = async () => {
    try {
      setLoading(true);

      // Fetch consultation details
      const consultationRes = await fetch(
        `/api/consultations/${consultationId}`,
      );
      if (!consultationRes.ok) throw new Error(t("consultations.failedToLoad"));
      const consultationData = await consultationRes.json();
      setConsultation(consultationData.consultation);

      // Check if consultation is already completed
      if (consultationData.consultation?.status === "completed") {
        setIsCompleted(true);
        if (consultationData.consultation?.soap_note) {
          setSoapNote(consultationData.consultation.soap_note);
        }
        if (consultationData.consultation?.medical_codes) {
          setMedicalCodes(consultationData.consultation.medical_codes);
        }
      }

      // Check if we already have a saved summary
      if (consultationData.consultation?.ai_summary) {
        setSummary(consultationData.consultation.ai_summary);
      }

      // Fetch transcripts (should be diarized by now)
      const transcriptsRes = await fetch(
        `/api/consultations/${consultationId}/transcripts`,
      );
      if (!transcriptsRes.ok)
        throw new Error(t("consultations.failedToLoadTranscripts"));
      const transcriptsData = await transcriptsRes.json();
      setTranscripts(transcriptsData.transcripts || []);
    } catch (err: any) {
      console.error("Error loading consultation:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setIsGeneratingSummary(true);
      setError(null);

      const response = await fetch(
        `/api/consultations/${consultationId}/summary`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      console.error("Error generating summary:", err);
      setError(err.message || t("consultations.failedToGenerateSummary"));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCompleteConsultation = async () => {
    setIsGeneratingSOAP(true);
    setError(null);

    let soapNoteResult: string | null = null;
    let codesResult: MedicalCodes | null = null;

    // Step 1: try SOAP note generation
    try {
      console.log("Generating SOAP note...");
      const soapResponse = await fetch(
        `/api/consultations/${consultationId}/soap-note`,
        {
          method: "POST",
        },
      );
      if (soapResponse.ok) {
        const soapData = await soapResponse.json();
        soapNoteResult = soapData.soapNote;
        setSoapNote(soapData.soapNote);
        console.log("SOAP note generated successfully");
      }
    } catch (e) {
      console.error("Error generating SOAP note:", e);
    }

    // Step 2: try medical codes generation
    try {
      console.log("Generating medical codes...");
      const codesResponse = await fetch(
        `/api/consultations/${consultationId}/medical-codes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soapNote: soapNoteResult }),
        },
      );
      if (codesResponse.ok) {
        const codesData = await codesResponse.json();
        codesResult = codesData.medicalCodes;
        setMedicalCodes(codesData.medicalCodes);
        console.log("Medical codes generated successfully");
      }
    } catch (e) {
      console.error("Error generating medical codes:", e);
    }

    // Step 3: save doctor notes (optional)
    if (doctorNotes.trim()) {
      try {
        await fetch(`/api/consultations/${consultationId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: doctorNotes }),
        });
      } catch (e) {
        console.error("Error saving doctor notes:", e);
      }
    }

    // Step 4: ALWAYS mark as completed
    try {
      await fetch(`/api/consultations/${consultationId}/end`, {
        method: "POST",
      });
      setIsCompleted(true);
    } catch (e) {
      console.error("Failed to end consultation:", e);
    }

    // Step 5: save documents (best effort)
    try {
      console.log("Creating consultation documents...");
      await fetch(`/api/consultations/${consultationId}/create-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          soapNote: soapNoteResult,
          medicalCodes: codesResult,
        }),
      });
      console.log("Consultation documents created");
    } catch (e) {
      console.error("Error creating consultation documents:", e);
    }

    setIsGeneratingSOAP(false);
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSpeakerIcon = (speaker: string) => {
    if (speaker === "doctor") {
      return <Stethoscope className="w-3 h-3 text-blue-600" />;
    } else if (speaker === "patient") {
      return <User className="w-3 h-3 text-green-600" />;
    }
    return null;
  };

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === "doctor") return "DOCTOR";
    if (speaker === "patient") return "PATIENT";
    return "UNKNOWN";
  };

  const getSpeakerColor = (speaker: string) => {
    if (speaker === "doctor") return "text-blue-600 bg-blue-50";
    if (speaker === "patient") return "text-green-600 bg-green-50";
    return "text-gray-500 bg-gray-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
          <div className="text-base font-semibold text-foreground">
            {t("consultations.loadingConsultation")}
          </div>
        </div>
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <div className="text-base font-semibold text-foreground">{error}</div>
          <Button onClick={() => router.back()} className="mt-4">
            {t("consultations.goBack")}
          </Button>
        </div>
      </div>
    );
  }

  // Consultation Completed View
  if (isCompleted) {
    return (
      <div className="max-w-6xl mx-auto space-y-3 md:space-y-4 pb-24">
        {/* Success Header */}
        <div className="glass-card-strong p-4 md:p-6 border-l-4 border-green-500 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <PartyPopper className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            {t("summaryPage.consultationComplete")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("summaryPage.allDocsSaved")}
          </p>

          {consultation && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border text-left">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("consultations.patient")}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {consultation.patient.full_name}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("consultations.doctor")}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {consultation.doctor.full_name}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("consultations.consultationCode")}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {consultation.consultation_code}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Documents Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {t("summaryPage.transcriptLabel")}
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {transcripts.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("summaryPage.segmentsCaptured")}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {t("summaryPage.soapNoteLabel")}
              </span>
            </div>
            <div className="text-2xl font-bold text-green-500">✓</div>
            <div className="text-xs text-muted-foreground">
              {t("summaryPage.generated")}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {t("summaryPage.medicalCodesLabel")}
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {medicalCodes
                ? (medicalCodes.icd10?.length || 0) +
                  (medicalCodes.cpt?.length || 0)
                : 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("summaryPage.codesIdentified")}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {summary && (
          <div className="glass-card">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    {t("summaryPage.aiSummary")}
                  </h2>
                </div>
                <button
                  onClick={() => exportToPdf("summary-content", "Summary.pdf")}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t("summaryPage.downloadPdf")}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div
                id="summary-content"
                className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground"
              >
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* SOAP Note */}
        {soapNote && (
          <div className="glass-card">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    {t("summaryPage.soapNoteLabel")}
                  </h2>
                </div>
                <button
                  onClick={() =>
                    exportToPdf("soap-note-content", "SOAP_Note.pdf")
                  }
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t("summaryPage.downloadPdf")}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div
                id="soap-note-content"
                className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground"
              >
                <ReactMarkdown>{soapNote}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Medical Codes */}
        {medicalCodes && (
          <div className="glass-card">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    {t("summaryPage.medicalCodesLabel")}
                  </h2>
                </div>
                <button
                  onClick={() =>
                    exportToPdf("medical-codes-content", "Medical_Codes.pdf")
                  }
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t("summaryPage.downloadPdf")}
                </button>
              </div>
            </div>
            <div id="medical-codes-content" className="p-4 space-y-4">
              {/* ICD-10 Codes */}
              {medicalCodes.icd10 && medicalCodes.icd10.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {t("consultationResults.icd10DiagnosisCodes")}
                  </h3>
                  <div className="space-y-2">
                    {medicalCodes.icd10.map((code, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-2 glass-card-strong rounded"
                      >
                        <span className="px-2 py-0.5 bg-muted text-foreground text-xs font-mono font-semibold rounded">
                          {code.code}
                        </span>
                        <span className="text-xs text-foreground flex-1">
                          {code.description}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {code.confidence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CPT Codes */}
              {medicalCodes.cpt && medicalCodes.cpt.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {t("consultationResults.cptProcedureCodes")}
                  </h3>
                  <div className="space-y-2">
                    {medicalCodes.cpt.map((code, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-2 glass-card-strong rounded"
                      >
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 text-xs font-mono font-semibold rounded">
                          {code.code}
                        </span>
                        <span className="text-xs text-foreground flex-1">
                          {code.description}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {code.confidence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="glass-card">
          <div className="border-b border-white/30 p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                {t("summaryPage.fullTranscript")}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transcripts.length} {t("summaryPage.segmentsSpeakerAi")}
            </p>
          </div>
          <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
            {transcripts.map((transcript, index) => (
              <div
                key={transcript.id || index}
                className="flex items-start gap-2 text-xs"
              >
                <span className="text-muted-foreground font-mono w-12 flex-shrink-0">
                  {formatTimestamp(transcript.timestamp_start)}
                </span>
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${getSpeakerColor(transcript.speaker)}`}
                >
                  {getSpeakerIcon(transcript.speaker)}
                  <span>{getSpeakerLabel(transcript.speaker)}</span>
                </div>
                <span className="text-foreground leading-relaxed">
                  {transcript.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Patients Button */}
        <div className="pt-4">
          <Button
            onClick={() => router.push("/patients" as any)}
            className="w-full text-sm font-semibold"
            size="default"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("summaryPage.backToPatients")}
          </Button>
        </div>
      </div>
    );
  }

  // Pre-completion View (generating state)
  return (
    <div className="max-w-6xl mx-auto space-y-3 md:space-y-4 pb-24">
      {/* Header */}
      <div className="glass-card-strong p-4 border-l-4 border-primary">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              {t("consultations.consultationSummary")}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t("consultations.reviewTranscription")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {t("consultations.sessionCompleted")}
            </span>
          </div>
        </div>

        {consultation && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/30">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {t("consultations.patient")}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {consultation.patient.full_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {t("consultations.doctor")}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {consultation.doctor.full_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {t("consultations.consultationCode")}
              </div>
              <div className="text-sm font-semibold text-foreground">
                {consultation.consultation_code}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diarized Transcription */}
      <div className="glass-card">
        <div className="border-b border-white/30 p-4">
          <h2 className="text-base font-semibold text-foreground">
            {t("consultations.fullTranscription")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {transcripts.length} {t("summaryPage.segmentsSpeakerAi")}
          </p>
        </div>

        <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
          {transcripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-xs">
                {t("consultations.noTranscriptsFound")}
              </p>
            </div>
          ) : (
            transcripts.map((transcript, index) => (
              <div
                key={transcript.id || index}
                className="flex items-start gap-2 text-xs"
              >
                <span className="text-muted-foreground font-mono w-12 flex-shrink-0">
                  {formatTimestamp(transcript.timestamp_start)}
                </span>
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${getSpeakerColor(transcript.speaker)}`}
                >
                  {getSpeakerIcon(transcript.speaker)}
                  <span>{getSpeakerLabel(transcript.speaker)}</span>
                </div>
                <span className="text-foreground leading-relaxed">
                  {transcript.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Summary Section */}
      <div className="glass-card">
        <div className="border-b border-white/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {t("consultations.aiGeneratedSummary")}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("consultations.letAISummarize")}
                </p>
              </div>
            </div>

            {!summary && (
              <Button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary || transcripts.length === 0}
                size="sm"
                className="font-semibold"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    {t("consultations.generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-2" />
                    {t("consultations.generateSummary")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {summary ? (
          <div className="p-4">
            <div className="glass-card-strong p-3 rounded-lg prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              variant="outline"
              size="sm"
              className="mt-3 font-semibold"
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  {t("summaryPage.regenerating")}
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-2" />
                  {t("summaryPage.regenerateSummary")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-xs">
              {transcripts.length === 0
                ? t("consultations.noTranscriptsAvailable")
                : t("consultations.clickToGenerateSummary")}
            </p>
          </div>
        )}
      </div>

      {/* Doctor's Notes (Optional) */}
      <div className="glass-card">
        <div className="border-b border-white/30 p-4">
          <h2 className="text-base font-semibold text-foreground">
            {t("consultations.yourNotesAndThoughts")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("consultations.addObservations")} ({t("summaryPage.optional")})
          </p>
        </div>

        <div className="p-4">
          <Textarea
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder={t("consultations.enterClinicalNotes")}
            className="min-h-[150px] text-xs resize-y"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {t("consultations.notesWillBeUsed")}
          </p>
        </div>
      </div>

      {/* Complete Consultation Button */}
      <div className="pt-4">
        <Button
          onClick={handleCompleteConsultation}
          disabled={isGeneratingSOAP || transcripts.length === 0}
          className="w-full text-sm font-semibold disabled:opacity-50"
          size="default"
        >
          {isGeneratingSOAP ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("summaryPage.generatingSoapAndCodes")}
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t("summaryPage.completeAndGenerate")}
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-destructive text-xs">
              {t("consultations.error")}
            </div>
            <div className="text-xs text-foreground mt-1">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
