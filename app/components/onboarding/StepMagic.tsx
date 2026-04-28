"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
import { useSarvamSTT } from "@/hooks/useSarvamSTT";
import { useSarvamStreamingSTT } from "@/hooks/useSarvamStreamingSTT";
import type { SOAPNote } from "@/lib/sarvam/types";
import { useTranslations, useLocale } from "next-intl";
import { ListeningOrb } from "@/components/consultation/ListeningOrb";

const STREAMING_ENABLED = process.env.NEXT_PUBLIC_STT_STREAMING === "true";

type Phase = "prompt" | "recording" | "processing" | "results";

interface StepMagicProps {
  onContinue: (
    transcript?: string,
    soapNote?: Record<string, string> | null,
  ) => void;
  onBack: () => void;
}

export function StepMagic({ onContinue, onBack }: StepMagicProps) {
  const t = useTranslations("onboarding.magicStep");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isBatchMode = locale === "id";
  const [phase, setPhase] = useState<Phase>("prompt");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [duration, setDuration] = useState(0);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const stoppingRef = useRef(false);

  // India: Sarvam streaming. Both hooks are unconditionally called to keep
  // React's hook order stable; the inactive one never does any work since
  // start() is what triggers the mic / WS / fetch.
  // - When NEXT_PUBLIC_STT_STREAMING=true: use the WebSocket path with
  //   server-side VAD, same as the consult flow. No consultationId yet
  //   (doctor is being onboarded), so the token is issued under the
  //   "onboarding" purpose.
  // - When the flag is off: fall back to the REST 3s-chunk path.
  const restStt = useSarvamSTT({ languageCode: "unknown", locale });
  const streamingStt = useSarvamStreamingSTT({
    languageCode: "unknown",
    mode: "codemix",
  });
  const stt = STREAMING_ENABLED ? streamingStt : restStt;

  // Indonesia: batch recording (record everything, transcribe at end)
  const batchStreamRef = useRef<MediaStream | null>(null);
  const batchRecorderRef = useRef<MediaRecorder | null>(null);
  const batchChunksRef = useRef<Blob[]>([]);
  const batchDurationTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const batchStartTimeRef = useRef(0);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchPermissionDenied, setBatchPermissionDenied] = useState(false);

  useEffect(() => {
    return () => {
      if (maxDurationTimerRef.current)
        clearTimeout(maxDurationTimerRef.current);
      if (batchDurationTimerRef.current)
        clearInterval(batchDurationTimerRef.current);
      if (batchStreamRef.current)
        batchStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // --- Shared: generate SOAP from transcript ---
  const generateSoap = useCallback(
    async (finalTranscript: string) => {
      setPhase("processing");

      if (!finalTranscript.trim()) {
        setPhase("prompt");
        stoppingRef.current = false;
        return;
      }

      // For Indonesia, skip translation — SOAP handles Bahasa natively via Claude
      let englishText = finalTranscript;

      if (!isBatchMode) {
        const detectedLang = stt.detectedLanguageRef.current;
        if (detectedLang && detectedLang !== "en-IN") {
          try {
            const res = await fetch("/api/consultation/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: finalTranscript,
                sourceLang: detectedLang,
                targetLang: "en-IN",
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.translated_text) {
                setTranslation(data.translated_text);
                englishText = data.translated_text;
              }
            }
          } catch {
            /* use original */
          }
        }
      }

      const localeFallback = isBatchMode
        ? {
            subjective: englishText,
            objective:
              "Tanda vital dalam batas normal. Temuan pemeriksaan fisik akan didokumentasikan selama konsultasi.",
            assessment: "Penilaian menunggu evaluasi klinis lengkap.",
            plan: "1. Evaluasi klinis lengkap\n2. Pemeriksaan penunjang yang relevan\n3. Tindak lanjut sesuai kebutuhan",
          }
        : {
            subjective: englishText,
            objective:
              "Vitals within normal limits. Physical examination findings to be documented during consultation.",
            assessment: "Assessment pending full clinical evaluation.",
            plan: "1. Complete clinical evaluation\n2. Order relevant investigations\n3. Follow-up as needed",
          };

      try {
        const res = await fetch("/api/consultation/soap-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: englishText, locale }),
        });
        if (res.ok) {
          const data = await res.json();
          setSoapNote(data.soap);
        }
      } catch {
        setSoapNote(localeFallback);
      }

      setPhase("results");
      stoppingRef.current = false;
    },
    [isBatchMode, stt],
  );

  // --- India: Sarvam streaming start/stop ---
  const handleMicClickStreaming = async () => {
    stt.resetTranscript();
    setTranslation(null);
    setSoapNote(null);
    setTranscript("");
    stoppingRef.current = false;
    setPhase("recording");
    await stt.start();

    maxDurationTimerRef.current = setTimeout(() => {
      if (!stoppingRef.current) handleStopStreaming();
    }, 120000);
  };

  const handleStopStreaming = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    stt.stop();
    const finalTranscript = stt.transcriptRef.current;
    setTranscript(finalTranscript);
    await generateSoap(finalTranscript);
  }, [stt, generateSoap]);

  // --- Indonesia: batch record → full audio → Deepgram ---
  const handleMicClickBatch = async () => {
    setTranslation(null);
    setSoapNote(null);
    setTranscript("");
    setBatchError(null);
    setBatchPermissionDenied(false);
    stoppingRef.current = false;
    batchChunksRef.current = [];
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      batchStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      batchRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) batchChunksRef.current.push(e.data);
      };

      recorder.start(500);
      batchStartTimeRef.current = Date.now();
      batchDurationTimerRef.current = setInterval(() => {
        setDuration(
          Math.floor((Date.now() - batchStartTimeRef.current) / 1000),
        );
      }, 500);

      setPhase("recording");

      maxDurationTimerRef.current = setTimeout(() => {
        if (!stoppingRef.current) handleStopBatch();
      }, 120000);
    } catch (err: unknown) {
      const error = err as Error;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setBatchPermissionDenied(true);
        setBatchError("Microphone access denied");
      } else {
        setBatchError(error.message || "Failed to start recording");
      }
    }
  };

  const handleStopBatch = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (batchDurationTimerRef.current) {
      clearInterval(batchDurationTimerRef.current);
      batchDurationTimerRef.current = null;
    }

    // Stop recorder and collect final data
    if (batchRecorderRef.current?.state === "recording") {
      await new Promise<void>((resolve) => {
        batchRecorderRef.current!.onstop = () => resolve();
        batchRecorderRef.current!.stop();
      });
    }

    if (batchStreamRef.current) {
      batchStreamRef.current.getTracks().forEach((t) => t.stop());
      batchStreamRef.current = null;
    }

    const chunks = batchChunksRef.current;
    batchChunksRef.current = [];

    if (chunks.length === 0) {
      setPhase("prompt");
      stoppingRef.current = false;
      return;
    }

    setPhase("processing");

    try {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", audioBlob, "onboarding.webm");
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
      const finalTranscript = data.transcript || "";
      setTranscript(finalTranscript);
      await generateSoap(finalTranscript);
    } catch (err: unknown) {
      const error = err as Error;
      setBatchError(error.message || "Transcription failed");
      setPhase("prompt");
      stoppingRef.current = false;
    }
  }, [generateSoap]);

  // --- Unified handlers ---
  const handleMicClick = isBatchMode
    ? handleMicClickBatch
    : handleMicClickStreaming;
  const handleStop = isBatchMode ? handleStopBatch : handleStopStreaming;

  // Derived state for UI
  const isRecording = isBatchMode ? phase === "recording" : stt.isRecording;
  const isConnecting = isBatchMode ? false : stt.isConnecting;
  const currentDuration = isBatchMode ? duration : stt.duration;
  const currentTranscript = isBatchMode ? transcript : stt.transcript;
  const currentInterimText = isBatchMode ? "" : stt.interimText;
  const currentStream = isBatchMode
    ? batchStreamRef.current
    : stt.streamRef.current;
  const permissionDenied = isBatchMode
    ? batchPermissionDenied
    : stt.permissionDenied;
  const currentError = isBatchMode ? batchError : stt.error;

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const soapSections: { key: keyof SOAPNote; label: string; color: string }[] =
    [
      { key: "subjective", label: t("subjective"), color: "text-emerald-400" },
      { key: "objective", label: t("objective"), color: "text-blue-400" },
      { key: "assessment", label: t("assessment"), color: "text-amber-400" },
      { key: "plan", label: t("plan"), color: "text-purple-400" },
    ];

  return (
    <div className="flex flex-col h-full">
      {/* Header — pinned */}
      <div className="flex-shrink-0 pt-4 pb-4">
        {(phase === "prompt" || phase === "recording") && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {phase === "prompt" ? t("titlePrompt") : t("titleListening")}
            </h2>
            <p className="font-display text-foreground/50 tracking-wide">
              {phase === "prompt" ? (
                t("subtitlePrompt")
              ) : (
                <span className="font-mono text-sm">
                  {formatDuration(currentDuration)}
                </span>
              )}
            </p>
          </div>
        )}
        {phase === "processing" && (
          <h2 className="text-2xl font-bold text-foreground">
            {t("titleProcessing")}
          </h2>
        )}
        {phase === "results" && (
          <h2 className="text-2xl font-bold text-foreground">
            {t("titleResults")}
          </h2>
        )}
      </div>

      {/* Content — scrollable middle */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Prompt: empty transcript area */}
        {phase === "prompt" && (
          <div className="h-full flex flex-col">
            {permissionDenied ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <MicOff className="w-7 h-7 text-destructive" />
                </div>
                <p className="text-foreground font-medium text-center">
                  {t("micDeniedTitle")}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {t("micDeniedDesc")}
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <ListeningOrb size={220} agentState={null} />
                <p className="text-muted-foreground/50 text-sm italic">
                  {t("transcriptPlaceholder")}
                </p>
              </div>
            )}

            {currentError && !isConnecting && (
              <p className="text-xs text-destructive mt-3">
                {currentError}. Please try again.
              </p>
            )}
          </div>
        )}

        {/* Recording: live transcript or recording indicator */}
        {phase === "recording" && (
          <div className="h-full flex flex-col gap-4">
            <div className="flex-shrink-0 flex justify-center">
              <ListeningOrb
                stream={currentStream}
                size={160}
                agentState="listening"
              />
            </div>
            <div className="flex-1 rounded-xl border border-border/30 bg-muted/5 p-4 overflow-y-auto">
              {currentTranscript || currentInterimText ? (
                <p className="text-foreground leading-relaxed">
                  {currentTranscript}
                  {currentInterimText && (
                    <span className="text-foreground/40">
                      {currentTranscript ? " " : ""}
                      {currentInterimText}
                    </span>
                  )}
                  <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-1 align-middle" />
                </p>
              ) : (
                <p className="text-muted-foreground/50 text-sm text-center">
                  {t("startSpeaking")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Processing */}
        {phase === "processing" && (
          <div className="space-y-6">
            {currentTranscript && (
              <div className="bg-muted/10 rounded-xl p-4 border border-border/20">
                <p className="text-sm text-foreground leading-relaxed">
                  {currentTranscript}
                </p>
              </div>
            )}
            <div className="h-1 rounded-full overflow-hidden bg-muted/30">
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ width: "50%" }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("generatingSOAP")}
            </p>
          </div>
        )}

        {/* Results */}
        {phase === "results" && soapNote && (
          <div>
            <div className="bg-muted/10 rounded-xl p-4 border border-border/20 mb-4">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                {t("whatYouSaid")}
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {currentTranscript}
              </p>
            </div>

            {translation && (
              <div className="bg-muted/10 rounded-xl p-4 border border-border/20 mb-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {t("translation")}
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {translation}
                </p>
              </div>
            )}

            <div className="bg-card/50 border border-border/50 rounded-xl p-5">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {t("soapNote")}
              </h3>
              <div className="space-y-4">
                {soapSections.map((section, i) => (
                  <motion.div
                    key={section.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.15 }}
                  >
                    <p
                      className={`text-sm font-semibold mb-1 ${section.color}`}
                    >
                      {section.label}
                    </p>
                    <p
                      className={`text-sm leading-relaxed whitespace-pre-line ${soapNote[section.key] ? "text-foreground/80" : "text-muted-foreground/50 italic"}`}
                    >
                      {soapNote[section.key] || t("notDiscussed")}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-6">{t("tagline")}</p>
          </div>
        )}
      </div>

      {/* Footer — pinned bottom */}
      <div className="flex-shrink-0 pt-4 pb-4">
        {/* Stop button during recording */}
        {phase === "recording" && (
          <div className="flex justify-center">
            <button
              onClick={handleStop}
              disabled={currentDuration < 3}
              className="w-12 h-12 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
            >
              <Square className="w-5 h-5 text-white fill-current" />
            </button>
          </div>
        )}

        {/* Mic button above actions for prompt */}
        {phase === "prompt" && !permissionDenied && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <button
                onClick={handleMicClick}
                disabled={isConnecting}
                className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Mic className="w-6 h-6 text-primary-foreground" />
              </button>
            </div>
            <div className="flex items-center justify-start">
              <Button onClick={onBack} variant="ghost" size="sm">
                {tc("back")}
              </Button>
            </div>
          </div>
        )}

        {phase === "prompt" && permissionDenied && (
          <div className="flex justify-between">
            <Button onClick={onBack} variant="ghost" size="sm">
              Back
            </Button>
            <div />
          </div>
        )}

        {phase === "processing" && <div />}

        {phase === "results" && soapNote && (
          <div className="flex justify-end">
            <Button
              onClick={() =>
                onContinue(
                  currentTranscript || undefined,
                  soapNote ? { ...soapNote } : null,
                )
              }
              size="lg"
            >
              {tc("continue")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
