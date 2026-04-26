"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Square,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

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

interface TranscriptionViewBatchProps {
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

export function TranscriptionViewBatch({
  consultationId,
  isRecording,
  onStartRecording,
  onStopRecording,
  transcripts,
  onTranscriptUpdate,
  onDiarizationComplete,
}: TranscriptionViewBatchProps) {
  const router = useRouter();
  const t = useTranslations("consultations");
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFailed, setProcessingFailed] = useState(false);
  const [duration, setDuration] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const cleanup = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      setProcessingFailed(false);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(500);

      startTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      onStartRecording();
    } catch (err: unknown) {
      const error = err as Error;
      cleanup();
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setPermissionDenied(true);
        setError(t("batchMicDenied"));
      } else {
        setError(error.message || t("batchStartFailed"));
      }
    }
  }, [cleanup, onStartRecording]);

  const stopAndTranscribe = useCallback(async () => {
    if (!recorderRef.current) return;

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Stop the recorder and collect final data
    await new Promise<void>((resolve) => {
      const recorder = recorderRef.current!;
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    onStopRecording();

    const chunks = chunksRef.current;
    chunksRef.current = [];

    if (chunks.length === 0) {
      setError(t("batchNoAudio"));
      return;
    }

    setIsProcessing(true);
    setProcessingFailed(false);

    try {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", audioBlob, "consultation.webm");
      formData.append("locale", "id");
      formData.append("language_code", "id");

      const res = await fetch("/api/consultation/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Transcription failed");
      }

      const data = await res.json();

      if (data.segments && data.segments.length > 0) {
        // Save each segment to DB
        for (const seg of data.segments) {
          await fetch(`/api/consultations/${consultationId}/transcripts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              speaker: seg.speaker,
              text: seg.text,
              confidence: seg.confidence,
              timestamp_start: seg.timestamp_start,
              timestamp_end: seg.timestamp_end,
              language: "id",
            }),
          })
            .then(async (r) => {
              const saved = await r.json();
              if (saved.transcript?.id) {
                onTranscriptUpdate((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex((t) => t.id === seg.id);
                  if (idx !== -1) updated[idx].id = saved.transcript.id;
                  return updated;
                });
              }
            })
            .catch(() => {
              // proceed — transcript is in local state
            });
          onTranscriptUpdate((prev) => [...prev, seg as Transcript]);
        }
      } else if (data.transcript) {
        // Fallback: single segment from full transcript
        const seg: Transcript = {
          id: `batch-${Date.now()}`,
          speaker: "unknown",
          text: data.transcript,
          confidence: 0.8,
          timestamp_start: 0,
          timestamp_end: 0,
          created_at: new Date().toISOString(),
        };
        onTranscriptUpdate((prev) => [...prev, seg]);

        await fetch(`/api/consultations/${consultationId}/transcripts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speaker: "unknown",
            text: data.transcript,
            confidence: 0.8,
            timestamp_start: 0,
            timestamp_end: 0,
            language: "id",
          }),
        }).catch(() => {});
      }

      setIsProcessing(false);

      // Skip diarization — Deepgram Indonesian doesn't support speaker diarization.
      // AI inference (summary/SOAP generation) will determine speaker roles from context.
      if (onDiarizationComplete) {
        onDiarizationComplete(consultationId);
      } else {
        router.push(`/consultations/${consultationId}/summary` as any);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || t("batchTranscriptionFailed"));
      setProcessingFailed(true);
      setIsProcessing(false);
    }
  }, [
    consultationId,
    onStopRecording,
    onTranscriptUpdate,
    onDiarizationComplete,
    router,
  ]);

  const handleRetry = useCallback(async () => {
    setError(null);
    setProcessingFailed(false);
    await startRecording();
  }, [startRecording]);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-md">
      {/* Header */}
      <div className="border-b border-border p-2 md:p-2.5 lg:p-3 xl:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 lg:gap-4">
          <div>
            <h2 className="text-base md:text-xs lg:text-sm xl:text-2xl font-display uppercase font-bold">
              {t("batchConsultationRecording")}
            </h2>
            <p className="text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-muted-foreground mt-0.5 md:mt-1 uppercase">
              {t("batchSubtitle")}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3 flex-wrap">
            {processingFailed && !isProcessing && (
              <Button
                onClick={handleRetry}
                className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
              >
                <RefreshCw className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 mr-1 md:mr-1.5 lg:mr-2" />
                <span className="hidden lg:inline">{t("batchReRecord")}</span>
                <span className="lg:hidden">ULANG</span>
              </Button>
            )}

            {!isRecording && !isProcessing && !processingFailed && (
              <Button
                onClick={startRecording}
                className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
              >
                <Mic className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 mr-1 md:mr-1.5 lg:mr-2" />
                <span className="hidden lg:inline">{t("batchStart")}</span>
                <span className="lg:hidden">MULAI</span>
              </Button>
            )}

            {isRecording && !isProcessing && (
              <Button
                onClick={stopAndTranscribe}
                variant="outline"
                className="min-h-[44px] md:min-h-0 md:h-7 lg:h-8 xl:h-10 2xl:h-12 px-3 md:px-3 lg:px-4 xl:px-6 font-semibold uppercase bg-secondary border-border hover:bg-muted text-xs md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs"
              >
                <Square className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 mr-1 md:mr-1.5 lg:mr-2" />
                <span className="hidden lg:inline">
                  {t("batchStopAndTranscribe")}
                </span>
                <span className="lg:hidden">SELESAI</span>
              </Button>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-sm font-semibold uppercase">
                  {t("batchProcessing")}
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

      {/* Transcript Display */}
      <div className="p-2 md:p-2.5 lg:p-3 xl:p-4 space-y-1 md:space-y-1.5 max-h-[300px] md:max-h-[400px] lg:max-h-[500px] overflow-y-auto font-mono">
        {transcripts.length === 0 ? (
          <div className="text-center py-6 md:py-8 lg:py-10 xl:py-12 text-muted-foreground">
            <Mic className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 mx-auto mb-2 md:mb-3 lg:mb-4 opacity-30" />
            <p className="uppercase font-semibold text-[8px] md:text-[9px] lg:text-[10px] xl:text-sm">
              {t("batchNoTranscripts")}
            </p>
            <p className="text-[7px] md:text-[8px] lg:text-[9px] xl:text-xs mt-1 md:mt-2 uppercase">
              {t("batchClickToBegin")}
            </p>
          </div>
        ) : (
          transcripts.map((transcript, index) => (
            <div
              key={transcript.id || index}
              className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm text-foreground leading-relaxed"
            >
              <span className="text-muted-foreground font-mono">
                {formatTimestamp(transcript.timestamp_start)}
              </span>
              <span className="text-muted-foreground mx-2">|</span>
              <span>{transcript.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer status */}
      {isRecording && !isProcessing && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-secondary">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-foreground">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold uppercase">
              {t("batchRecording")}
            </span>
            <span className="opacity-50">|</span>
            <span className="uppercase font-mono">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-muted">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-foreground">
            <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 animate-spin" />
            <span className="font-semibold uppercase">
              {t("batchSendingToDeepgram")}
            </span>
          </div>
        </div>
      )}

      {transcripts.length > 0 && !isRecording && !isProcessing && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-secondary">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-foreground">
            <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 text-green-500" />
            <span className="font-semibold uppercase">
              {t("batchTranscriptComplete")}
            </span>
            <span className="opacity-50">|</span>
            <span className="uppercase">
              {t("batchSegments", { count: transcripts.length })}
            </span>
          </div>
        </div>
      )}

      {processingFailed && !isProcessing && (
        <div className="border-t border-border p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-destructive/10">
          <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 text-[7px] md:text-[8px] lg:text-[9px] xl:text-sm text-destructive">
            <AlertCircle className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" />
            <span className="font-semibold uppercase">{t("batchFailed")}</span>
          </div>
        </div>
      )}

      {/* Provider footer */}
      <div className="border-t border-border px-3 py-1.5 flex items-center justify-end">
        <span className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs text-muted-foreground uppercase tracking-wider">
          {t("batchProviderFooter")}
        </span>
      </div>
    </div>
  );
}
