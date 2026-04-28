"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "@/src/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { SARVAM_LANGUAGES, type SarvamLanguageCode } from "@/lib/sarvam/types";
import { useSarvamSTT } from "@/hooks/useSarvamSTT";
import { useSarvamStreamingSTT } from "@/hooks/useSarvamStreamingSTT";
import { useTranslations } from "next-intl";
import { ListeningOrb } from "@/components/consultation/ListeningOrb";

const STREAMING_ENABLED = process.env.NEXT_PUBLIC_STT_STREAMING === "true";

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

interface TranscriptionViewStreamingProps {
  consultationId: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  transcripts: Transcript[];
  onTranscriptUpdate: (
    transcripts: Transcript[] | ((prev: Transcript[]) => Transcript[]),
  ) => void;
  onDiarizationComplete?: (consultationId: string) => void;
}

export function TranscriptionViewStreaming({
  consultationId,
  isRecording,
  onStartRecording,
  onStopRecording,
  transcripts,
  onTranscriptUpdate,
  onDiarizationComplete,
}: TranscriptionViewStreamingProps) {
  const router = useRouter();
  const t = useTranslations("consultations");
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);
  const [language, setLanguage] = useState<SarvamLanguageCode>("unknown");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [interimText, setInterimText] = useState("");
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<number>(0);
  const pausedRef = useRef(false);

  const handleTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (pausedRef.current) return;

      if (isFinal) {
        const currentTime = (Date.now() - sessionStartTime.current) / 1000;
        const newTranscript: Transcript = {
          id: `transcript-${Date.now()}-${Math.random()}`,
          speaker: "unknown",
          text: text,
          confidence: 0.9,
          timestamp_start: currentTime,
          timestamp_end: currentTime,
          created_at: new Date().toISOString(),
        };

        onTranscriptUpdate((prev) => [...prev, newTranscript]);
        setInterimText("");

        // Save to database
        fetch(`/api/consultations/${consultationId}/transcripts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speaker: "unknown",
            text: text,
            confidence: 0.9,
            timestamp_start: currentTime,
            timestamp_end: currentTime,
            language: language.split("-")[0],
          }),
        })
          .then(async (res) => {
            const savedData = await res.json();
            if (savedData.transcript?.id) {
              onTranscriptUpdate((prev) => {
                const newTranscripts = [...prev];
                const idx = newTranscripts.findIndex(
                  (t) => t.id === newTranscript.id,
                );
                if (idx !== -1) {
                  newTranscripts[idx].id = savedData.transcript.id;
                }
                return newTranscripts;
              });
            }
          })
          .catch(() => {
            // failed to save, already in local state
          });
      } else {
        setInterimText(text);
      }
    },
    [consultationId, language, onTranscriptUpdate],
  );

  const handleSTTError = useCallback((errMsg: string) => {
    setError(errMsg.toUpperCase());
    if (
      errMsg.toLowerCase().includes("denied") ||
      errMsg.toLowerCase().includes("permission")
    ) {
      setPermissionDenied(true);
    }
  }, []);

  // Both hooks are unconditionally called to keep React's hook order
  // stable across renders; only the active one ever does real work since
  // `start()` is what kicks off the mic / WS / fetch.
  const restStt = useSarvamSTT({
    languageCode: language,
    onTranscript: handleTranscript,
    onError: handleSTTError,
  });
  const streamingStt = useSarvamStreamingSTT({
    consultationId,
    languageCode: language,
    mode: "codemix",
    onTranscript: handleTranscript,
    onError: handleSTTError,
  });
  const stt = STREAMING_ENABLED ? streamingStt : restStt;

  // Auto-scroll to latest transcript
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts, interimText]);

  const startSession = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);
    setInterimText("");
    sessionStartTime.current = Date.now();
    pausedRef.current = false;

    await stt.start();

    if (!stt.permissionDenied) {
      onStartRecording();
    }
  }, [stt, onStartRecording]);

  const handleStop = useCallback(() => {
    stt.stop();
    setIsPaused(false);
    setInterimText("");
    pausedRef.current = false;
    onStopRecording();
  }, [stt, onStopRecording]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    pausedRef.current = true;
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    pausedRef.current = false;
  }, []);

  const handleRestart = useCallback(() => {
    handleStop();
    onTranscriptUpdate([]);
    setError(null);
    setInterimText("");
    setTimeout(() => {
      startSession();
    }, 500);
  }, [handleStop, onTranscriptUpdate, startSession]);

  const handleEndConsultation = useCallback(async () => {
    handleStop();
    setIsGeneratingReport(true);
    setReportFailed(false);
    setError(null);

    try {
      const diarizeResponse = await fetch(
        `/api/consultations/${consultationId}/diarize`,
        { method: "POST" },
      );

      if (!diarizeResponse.ok) {
        const errorData = await diarizeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to diarize conversation");
      }

      if (onDiarizationComplete) {
        onDiarizationComplete(consultationId);
      } else {
        router.push(`/consultations/${consultationId}/summary` as any);
      }
    } catch (err: any) {
      setError(
        err.message || "FAILED TO PROCESS TRANSCRIPT. PLEASE TRY AGAIN.",
      );
      setReportFailed(true);
      setIsGeneratingReport(false);
    }
  }, [handleStop, consultationId, router, onDiarizationComplete]);

  const handleRegenerateReports = useCallback(async () => {
    setIsGeneratingReport(true);
    setReportFailed(false);
    setError(null);

    try {
      const diarizeResponse = await fetch(
        `/api/consultations/${consultationId}/diarize`,
        { method: "POST" },
      );

      if (!diarizeResponse.ok) {
        const errorData = await diarizeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to diarize conversation");
      }

      if (onDiarizationComplete) {
        onDiarizationComplete(consultationId);
      } else {
        router.push(`/consultations/${consultationId}/summary` as any);
      }
    } catch (err: any) {
      setError(
        err.message || "FAILED TO REGENERATE REPORTS. PLEASE TRY AGAIN.",
      );
      setReportFailed(true);
      setIsGeneratingReport(false);
    }
  }, [consultationId, router, onDiarizationComplete]);

  const handleSkipToSummary = useCallback(() => {
    if (onDiarizationComplete) {
      onDiarizationComplete(consultationId);
    } else {
      router.push(`/consultations/${consultationId}/summary` as any);
    }
  }, [consultationId, router, onDiarizationComplete]);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedLang = SARVAM_LANGUAGES.find((l) => l.code === language);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-md">
      {/* Header */}
      <div className="border-b border-border p-2 md:p-2.5 lg:p-3 xl:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 lg:gap-4">
          <div>
            <h2 className="text-base md:text-xs lg:text-sm xl:text-2xl font-display uppercase font-bold">
              {t("realtimeTranscription")}
            </h2>
            <p className="text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-muted-foreground mt-0.5 md:mt-1 uppercase">
              {t("streamingSubtitle", {
                lang: selectedLang?.label || "Auto-detect",
              })}
            </p>
          </div>

          {/* Language Selector + Recording Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3 flex-wrap">
            {/* Language Selector */}
            {!isRecording && !isGeneratingReport && !reportFailed && (
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="h-6 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-2 md:px-3 lg:px-4 border border-border rounded-md flex items-center gap-1 text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs font-semibold uppercase bg-card hover:bg-muted transition-colors"
                >
                  {selectedLang?.label || "Auto-detect"}
                  <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3" />
                </button>
                {showLangDropdown && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto min-w-[120px]">
                    {SARVAM_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[8px] md:text-[9px] lg:text-[10px] uppercase hover:bg-muted transition-colors ${
                          language === lang.code
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-foreground"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Regenerate + Skip buttons when reports failed */}
            {reportFailed && !isGeneratingReport && (
              <>
                <Button
                  onClick={handleRegenerateReports}
                  className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
                >
                  <RefreshCw className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2" />
                  <span className="hidden lg:inline">
                    {t("regenerateReports")}
                  </span>
                  <span className="lg:hidden">{t("retry")}</span>
                </Button>
                <Button
                  onClick={handleSkipToSummary}
                  variant="outline"
                  className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-secondary border-border hover:bg-muted text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
                >
                  <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2" />
                  <span className="hidden lg:inline">{t("skipToSummary")}</span>
                  <span className="lg:hidden">{t("skip")}</span>
                </Button>
              </>
            )}

            {/* Start button */}
            {!isRecording &&
              !isPaused &&
              !isGeneratingReport &&
              !reportFailed && (
                <Button
                  onClick={startSession}
                  disabled={stt.isConnecting}
                  className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
                >
                  {stt.isConnecting ? (
                    <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2 animate-spin" />
                  ) : (
                    <Mic className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2" />
                  )}
                  <span className="hidden lg:inline">
                    {stt.isConnecting ? t("connecting") : t("startRecording")}
                  </span>
                  <span className="lg:hidden">
                    {stt.isConnecting ? "..." : "START"}
                  </span>
                </Button>
              )}

            {/* Pause button */}
            {isRecording && !isPaused && (
              <Button
                onClick={handlePause}
                variant="outline"
                className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-secondary border-border hover:bg-muted text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
              >
                <Pause className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2" />
                {t("pause")}
              </Button>
            )}

            {/* Resume/Restart/End buttons */}
            {isPaused && !isGeneratingReport && (
              <>
                <Button
                  onClick={handleResume}
                  variant="outline"
                  className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-secondary border-border hover:bg-muted text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
                >
                  <Play className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2" />
                  <span className="hidden md:inline">{t("resume")}</span>
                  <span className="md:hidden">RES</span>
                </Button>

                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-secondary border-border hover:bg-muted text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
                >
                  <RotateCcw className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2" />
                  <span className="hidden md:inline">{t("restart")}</span>
                  <span className="md:hidden">RST</span>
                </Button>

                <Button
                  onClick={handleEndConsultation}
                  className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
                >
                  <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 mr-1 md:mr-1.5 lg:mr-2" />
                  <span className="hidden xl:inline">
                    {t("endConsultation")}
                  </span>
                  <span className="hidden md:inline xl:hidden">END</span>
                  <span className="md:hidden">END</span>
                </Button>
              </>
            )}

            {isGeneratingReport && (
              <div className="flex items-center gap-2 text-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-sm font-semibold uppercase">
                  {t("generatingReports")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-2 md:mt-3 lg:mt-4 p-2 md:p-2.5 lg:p-3 xl:p-4 glass-card border-destructive/50 flex items-start gap-1.5 md:gap-2 lg:gap-3">
            <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-destructive uppercase text-[8px] md:text-[9px] lg:text-[10px] xl:text-sm">
                {t("error")}
              </div>
              <div className="text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-destructive/80 mt-0.5 md:mt-1 uppercase">
                {error}
              </div>
              {permissionDenied && (
                <Button
                  onClick={() => {
                    setError(null);
                    setPermissionDenied(false);
                  }}
                  variant="outline"
                  className="mt-1.5 md:mt-2 lg:mt-3 text-[7px] md:text-[8px] lg:text-[9px]"
                >
                  {t("tryAgain")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Listening Orb — active while recording */}
      {isRecording && !isPaused && (
        <div className="flex justify-center py-3 md:py-4 lg:py-5 xl:py-6 border-b border-border/50">
          <ListeningOrb
            stream={stt.streamRef.current}
            size={140}
            agentState="listening"
          />
        </div>
      )}

      {/* Transcript Display */}
      <div
        ref={transcriptContainerRef}
        className="p-2 md:p-2.5 lg:p-3 xl:p-4 space-y-1 md:space-y-1.5 max-h-[300px] md:max-h-[400px] lg:max-h-[500px] overflow-y-auto font-mono"
      >
        {transcripts.length === 0 && !interimText ? (
          <div className="flex flex-col items-center py-6 md:py-8 lg:py-10 xl:py-12 text-muted-foreground">
            {!isRecording && (
              <ListeningOrb
                size={120}
                agentState={null}
                className="mb-3 md:mb-4 lg:mb-5 opacity-80"
              />
            )}
            <p className="uppercase font-semibold text-[8px] md:text-[9px] lg:text-[10px] xl:text-sm">
              {t("noTranscriptsYet")}
            </p>
            <p className="text-[7px] md:text-[8px] lg:text-[9px] xl:text-xs mt-1 md:mt-2 uppercase">
              {t("clickStartToBegin")}
            </p>
          </div>
        ) : (
          <>
            {transcripts.map((transcript, index) => (
              <div
                key={transcript.id || index}
                className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm text-foreground leading-relaxed"
              >
                <span className="text-muted-foreground">
                  {formatTimestamp(transcript.timestamp_start)}
                </span>
                <span className="text-muted-foreground mx-2">|</span>
                <span>{transcript.text}</span>
              </div>
            ))}
            {/* Interim text (partial, not yet final) */}
            {interimText && (
              <div className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm text-foreground/50 leading-relaxed">
                <span className="text-muted-foreground/50">
                  {formatTimestamp(
                    (Date.now() - sessionStartTime.current) / 1000,
                  )}
                </span>
                <span className="text-muted-foreground/50 mx-2">|</span>
                <span>{interimText}</span>
                <span className="inline-block w-1.5 h-3 bg-primary/70 animate-pulse ml-1 align-middle" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      {isRecording && !isPaused && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-secondary">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-foreground">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold uppercase">{t("live")}</span>
            <span className="opacity-50">|</span>
            <span className="uppercase">
              {t("sentences", { count: transcripts.length })}
            </span>
            <span className="opacity-50">|</span>
            <span className="uppercase">{selectedLang?.label}</span>
            <span className="opacity-50">|</span>
            <span className="uppercase font-mono text-primary">WS</span>
          </div>
        </div>
      )}

      {isPaused && !isGeneratingReport && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-secondary">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-foreground">
            <Pause className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" />
            <span className="font-semibold uppercase">{t("paused")}</span>
            <span className="opacity-50">|</span>
            <span className="uppercase">
              {t("sentences", { count: transcripts.length })}
            </span>
          </div>
        </div>
      )}

      {isGeneratingReport && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-muted">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-foreground">
            <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 animate-spin" />
            <span className="font-semibold uppercase">
              {t("processingTranscript")}
            </span>
          </div>
        </div>
      )}

      {reportFailed && !isGeneratingReport && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-destructive/10">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-destructive">
            <AlertCircle className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" />
            <span className="font-semibold uppercase">
              {t("reportGenerationFailed")}
            </span>
          </div>
        </div>
      )}

      {/* Provider footer */}
      <div className="border-t border-border px-3 py-1.5 flex items-center justify-end">
        <span className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs text-muted-foreground uppercase tracking-wider">
          {t("streamingProviderFooter")}
        </span>
      </div>
    </div>
  );
}
