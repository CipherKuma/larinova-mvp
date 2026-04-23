# Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:using-agent-teams (large parallel plan with 8 tasks across 3+ domains) or superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-step form onboarding with a 5-step animated experience that builds to a live Sarvam AI transcription demo.

**Architecture:** Orchestrator page (`onboarding/page.tsx`) manages step state and renders step components. Shared `OnboardingCard` + `ParticleDust` + `ProgressBar` provide consistent UI. New Sarvam API routes (`/translate`, `/soap`) power Step 3's demo. A `useAudioRecorder` hook extracts recording logic for reuse.

**Tech Stack:** Next.js 16, React 19, framer-motion, Sarvam AI APIs (STT, Translate, Chat), Supabase Auth

**Spec:** `docs/superpowers/specs/2026-03-20-onboarding-redesign-design.md`

---

## Task 1: Sarvam API Layer (Backend)

Extend the Sarvam client library and create two new API routes.

**Files:**
- Modify: `lib/sarvam/client.ts`
- Modify: `lib/sarvam/types.ts`
- Create: `lib/sarvam/prompts.ts`
- Create: `app/api/sarvam/translate/route.ts`
- Create: `app/api/sarvam/soap/route.ts`

- [ ] **Step 1: Add translate + chat types to `lib/sarvam/types.ts`**

Add after existing types:

```typescript
export interface SarvamTranslateRequest {
  input: string;
  source_language_code: string;
  target_language_code: string;
}

export interface SarvamTranslateResponse {
  translated_text: string;
}

export interface SarvamChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SarvamChatRequest {
  model: string;
  messages: SarvamChatMessage[];
}

export interface SarvamChatResponse {
  choices: { message: { content: string } }[];
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}
```

- [ ] **Step 2: Add `translateText()` and `generateChat()` to `lib/sarvam/client.ts`**

```typescript
const SARVAM_BASE = "https://api.sarvam.ai";

export async function translateText(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string = "en-IN"
) {
  const response = await fetch(`${SARVAM_BASE}/translate`, {
    method: "POST",
    headers: {
      "API-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLang,
      target_language_code: targetLang,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sarvam translate error: ${response.status} - ${error}`);
  }
  return response.json();
}

export async function generateChat(
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string = "saaras:v2"
) {
  const response = await fetch(`${SARVAM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "API-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sarvam chat error: ${response.status} - ${error}`);
  }
  return response.json();
}
```

Also refactor `transcribeAudio` to use the shared `SARVAM_BASE` constant. Remove `translateText()` and `generateChat()` from client.ts — the API routes will inline the fetch calls directly to avoid dead code.

- [ ] **Step 3: Create `lib/sarvam/prompts.ts`**

```typescript
export const SOAP_SYSTEM_PROMPT = `You are a medical documentation assistant. Generate a SOAP note from the following consultation transcript. Format your response as JSON with exactly these keys: "subjective", "objective", "assessment", "plan". Each value should be a concise string. Keep it professional. If the transcript is short or incomplete, fill in reasonable placeholder content for a demo.`;

export const SOAP_FALLBACK = {
  subjective: "",  // Will be filled with actual transcript
  objective: "Vitals within normal limits. Physical examination findings to be documented during consultation.",
  assessment: "Assessment pending full clinical evaluation.",
  plan: "1. Complete clinical evaluation\n2. Order relevant investigations\n3. Follow-up as needed",
};
```

- [ ] **Step 4: Create `app/api/sarvam/translate/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Sarvam API key not configured" }, { status: 500 });
    }

    const { text, sourceLang, targetLang } = await request.json();
    if (!text || !sourceLang) {
      return NextResponse.json({ error: "text and sourceLang required" }, { status: 400 });
    }

    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "API-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sourceLang,
        target_language_code: targetLang || "en-IN",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SARVAM] Translate error:", response.status, errorText);
      return NextResponse.json({ error: `Translation failed: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[SARVAM] Translate error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create `app/api/sarvam/soap/route.ts`**

Uses Sarvam `/chat/completions` with the SOAP prompt. 8-second timeout with fallback.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { SOAP_SYSTEM_PROMPT, SOAP_FALLBACK } from "@/lib/sarvam/prompts";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Sarvam API key not configured" }, { status: 500 });
    }

    const { transcript } = await request.json();
    if (!transcript) {
      return NextResponse.json({ error: "transcript required" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch("https://api.sarvam.ai/chat/completions", {
        method: "POST",
        headers: {
          "API-Subscription-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "saaras:v2",
          messages: [
            { role: "system", content: SOAP_SYSTEM_PROMPT },
            { role: "user", content: transcript },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Sarvam chat error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      // Try to parse as JSON
      try {
        const soap = JSON.parse(content);
        return NextResponse.json({ soap, fallback: false });
      } catch {
        // If not valid JSON, return as subjective with fallback for rest
        return NextResponse.json({
          soap: { ...SOAP_FALLBACK, subjective: content || transcript },
          fallback: true,
        });
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.log("[SARVAM] SOAP generation timed out, using fallback");
      } else {
        console.error("[SARVAM] SOAP generation failed:", err);
      }
      // Return fallback SOAP
      return NextResponse.json({
        soap: { ...SOAP_FALLBACK, subjective: transcript },
        fallback: true,
      });
    }
  } catch (error) {
    console.error("[SARVAM] SOAP route error:", error);
    return NextResponse.json({ error: "SOAP generation failed" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Verify build**

Run: `cd /Users/gabrielantonyxaviour/Documents/products/larinova/app && npm run build 2>&1 | tail -5`
Expected: Build succeeds with new routes visible in output.

- [ ] **Step 7: Commit**

```bash
git add lib/sarvam/ app/api/sarvam/translate app/api/sarvam/soap
git commit -m "feat(sarvam): add translate and SOAP generation API routes"
```

---

## Task 2: Shared UI Components

Create the reusable components: ParticleDust background, OnboardingCard, ProgressBar.

**Files:**
- Create: `components/onboarding/ParticleDust.tsx`
- Create: `components/onboarding/OnboardingCard.tsx`
- Create: `components/onboarding/ProgressBar.tsx`

- [ ] **Step 1: Create `components/onboarding/ParticleDust.tsx`**

CSS-based particle background. ~25 floating dots with varying sizes, colors (emerald/white), and drift speeds. Renders as a fixed full-screen layer behind content.

```tsx
"use client";

export function ParticleDust() {
  // Generate 25 particles with randomized properties
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    size: 1 + Math.random() * 1.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 15,
    delay: Math.random() * -20,
    isEmerald: Math.random() > 0.5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0, backgroundColor: "#0a0f1e" }}>
      {/* Grain texture overlay */}
      <div className="grain" />
      {/* Emerald radial glow at center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }}
      />
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.isEmerald
              ? `rgba(16,185,129,${0.2 + Math.random() * 0.2})`
              : `rgba(255,255,255,${0.08 + Math.random() * 0.12})`,
            boxShadow: p.isEmerald ? `0 0 ${p.size * 2}px rgba(16,185,129,0.15)` : "none",
            animation: `particle-drift-${p.id % 3} ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes particle-drift-0 {
          0% { transform: translateY(0) translateX(0); opacity: 0.6; }
          50% { opacity: 1; }
          100% { transform: translateY(-120px) translateX(30px); opacity: 0.6; }
        }
        @keyframes particle-drift-1 {
          0% { transform: translateY(0) translateX(0); opacity: 0.5; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-80px) translateX(-25px); opacity: 0.5; }
        }
        @keyframes particle-drift-2 {
          0% { transform: translateY(0) translateX(0); opacity: 0.7; }
          50% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(15px); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/onboarding/OnboardingCard.tsx`**

Shared selectable card with multi/single select mode, stagger animation, and emerald pulse on select.

```tsx
"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  featured?: boolean;
  index?: number;
  className?: string;
}

export function OnboardingCard({
  selected,
  onClick,
  children,
  featured,
  index = 0,
  className,
}: OnboardingCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-xl p-5 cursor-pointer transition-all duration-200",
        "bg-card/50 border border-border/50",
        "hover:border-border/80",
        selected && "border-primary bg-primary/5",
        featured && "border-l-2 border-l-primary",
        className,
      )}
      whileTap={{ scale: 0.98 }}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
      {/* Emerald pulse on selection */}
      {selected && (
        <motion.div
          initial={{ opacity: 0.4, boxShadow: "0 0 0 0 rgba(16,185,129,0)" }}
          animate={{ opacity: 0, boxShadow: "0 0 20px 5px rgba(16,185,129,0.2)" }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-xl pointer-events-none"
        />
      )}
      {children}
    </motion.button>
  );
}
```

- [ ] **Step 3: Create `components/onboarding/ProgressBar.tsx`**

```tsx
"use client";

interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

export function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  const percentage = (step / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 z-50">
      <div
        className="h-full bg-primary rounded-r-full"
        style={{
          width: `${percentage}%`,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/onboarding/
git commit -m "feat(onboarding): add ParticleDust, OnboardingCard, ProgressBar components"
```

---

## Task 3: Audio Recorder Hook

Extract clean recording logic for reuse in Step 3 and the existing TranscriptionViewSarvam.

**Files:**
- Create: `hooks/useAudioRecorder.ts`

- [ ] **Step 1: Create `hooks/useAudioRecorder.ts`**

Hook that manages MediaRecorder, creates chunked audio blobs at intervals, and provides start/stop/pause controls.

```typescript
"use client";

import { useRef, useState, useCallback } from "react";

interface UseAudioRecorderOptions {
  chunkIntervalMs?: number;
  maxDurationMs?: number;
  onChunk?: (blob: Blob) => void;
  onMaxDuration?: () => void;
}

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isStopping: boolean; // true after stop() called, false after final chunk delivered
  duration: number;
  error: string | null;
  permissionDenied: boolean;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const {
    chunkIntervalMs = 4000,
    maxDurationMs = 15000,
    onChunk,
    onMaxDuration,
  } = options;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    isStopping: false,
    duration: 0,
    error: null,
    permissionDenied: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") {
      try { mediaRecorderRef.current?.stop(); } catch {}
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    try {
      setState((s) => ({ ...s, error: null, permissionDenied: false }));

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          const blob = new Blob([e.data], { type: "audio/webm" });
          onChunk?.(blob);
        }
      };

      recorder.start(chunkIntervalMs);
      startTimeRef.current = Date.now();

      // Duration timer (updates every 100ms)
      durationTimerRef.current = setInterval(() => {
        setState((s) => ({
          ...s,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 100);

      // Max duration auto-stop
      if (maxDurationMs) {
        timerRef.current = setTimeout(() => {
          stop();
          onMaxDuration?.();
        }, maxDurationMs);
      }

      setState((s) => ({ ...s, isRecording: true, isPaused: false, duration: 0 }));
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setState((s) => ({ ...s, permissionDenied: true, error: "Microphone access denied" }));
      } else {
        setState((s) => ({ ...s, error: err.message || "Failed to start recording" }));
      }
    }
  }, [chunkIntervalMs, maxDurationMs, onChunk, onMaxDuration]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setState((s) => ({ ...s, isStopping: true }));
    // Request final data then cleanup
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
        setState((s) => ({ ...s, isRecording: false, isPaused: false, isStopping: false }));
      };
      mediaRecorderRef.current.stop(); // triggers final ondataavailable then onstop
    } else {
      cleanup();
      setState((s) => ({ ...s, isRecording: false, isPaused: false, isStopping: false }));
    }
  }, [cleanup]);

  return { ...state, start, stop };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useAudioRecorder.ts
git commit -m "feat: add useAudioRecorder hook for chunked audio recording"
```

---

## Task 4: Step 1 — Motivation

**Files:**
- Create: `components/onboarding/StepMotivation.tsx`

- [ ] **Step 1: Create `components/onboarding/StepMotivation.tsx`**

4 pain point cards (multi-select), logo, heading, continue button. Uses `OnboardingCard`. The first card is featured (emerald left border).

Pain points:
1. "My patients and I speak in Tamil, but I need documentation in English" (featured)
2. "I spend more time on paperwork than with patients"
3. "I need proper prescriptions but I'm still handwriting them"
4. "I can't remember everything from a 15-minute consultation"

Props: `{ onContinue: () => void }`. Internal state tracks `selectedPainPoints: Set<number>`. Continue disabled until `selectedPainPoints.size >= 1`.

Logo: `larinova-icon.png` with `brightness-0 invert`, 140px. Divider line below logo. Heading "What brings you here?" in Outfit 2xl bold.

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/StepMotivation.tsx
git commit -m "feat(onboarding): add Step 1 motivation cards"
```

---

## Task 5: Step 2 — Profile

**Files:**
- Create: `components/onboarding/StepProfile.tsx`

- [ ] **Step 1: Create `components/onboarding/StepProfile.tsx`**

Two phases:
- **Phase A:** 10 specialty cards in responsive grid (2/3/4 cols) + "Other" card. Single select. Uses `OnboardingCard`.
- **Phase B:** After specialty selected, registration fields expand in below (framer-motion `AnimatePresence`). Degrees, reg number, council dropdown. All optional.

Hardcoded specialty list (10 popular + ~40 in "Other" search). Council dropdown values must match exactly: "Medical Council of India (MCI)", "Tamil Nadu Medical Council", etc.

Props: `{ onContinue: (data: { specialty: string; degrees?: string; registrationNumber?: string; registrationCouncil?: string }) => void; onBack: () => void }`.

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/StepProfile.tsx
git commit -m "feat(onboarding): add Step 2 profile with specialty + credentials"
```

---

## Task 6: Step 3 — Magic Demo

The most complex step. Three phases: prompt → recording → SOAP generation.

**Files:**
- Create: `components/onboarding/StepMagic.tsx`

- [ ] **Step 1: Create `components/onboarding/StepMagic.tsx`**

**Phase A (Prompt):** Language selector pills (Tamil/English/Hindi), large pulsing mic button (80px emerald), "Skip demo →" link, mic permission denied fallback UI.

**Phase B (Recording):** Uses `useAudioRecorder` hook. Sends chunks to `/api/sarvam/transcribe`. Shows transcript updating in container. Timer top-right. Stop button appears after 3s. Auto-stops at 15s.

**Phase C (Processing → SOAP):**
1. After recording stops, wait for pending chunks
2. If non-English: call `/api/sarvam/translate` (show shimmer during)
3. Call `/api/sarvam/soap` with English text
4. Render SOAP sections (S, O, A, P) with 200ms stagger animation
5. Show "This is what every consultation will look like."
6. Show Continue button

Props: `{ onContinue: () => void; onBack: () => void; onSkip: () => void }`.

Key states: `phase: "prompt" | "recording" | "processing" | "results"`, `transcript: string`, `translation: string | null`, `soapNote: SOAPNote | null`, `selectedLanguage: SarvamLanguageCode`.

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/StepMagic.tsx
git commit -m "feat(onboarding): add Step 3 live transcription + SOAP demo"
```

---

## Task 7: Steps 4 & 5 — Prescription Preview + Celebration

**Files:**
- Create: `components/onboarding/StepPrescription.tsx`
- Create: `components/onboarding/StepCelebration.tsx`

- [ ] **Step 1: Create `components/onboarding/StepPrescription.tsx`**

MCI prescription preview card that slides up from bottom (framer-motion spring). Pre-fills doctor name (from Supabase auth user metadata), degrees/reg from Step 2 data. Placeholder italic text where data is missing. Sample patient (Ravi Kumar, M, 45) + 2 sample medicines.

Props: `{ doctorName: string; degrees?: string; registrationNumber?: string; registrationCouncil?: string; onContinue: () => void; onBack: () => void }`.

- [ ] **Step 2: Create `components/onboarding/StepCelebration.tsx`**

Canvas-based particle burst (50-80 emerald/white particles, gravity + fade, 1.5s). Heading "You're ready, Dr. [Name]" with text-gradient and word-by-word fade. Three quick-start hints stagger in. Auto-redirect to `/en` after 3 seconds.

Props: `{ doctorName: string; specialty: string; onComplete: () => void }`. Calls `onComplete` after 3s timeout which triggers the DB save + redirect.

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/StepPrescription.tsx components/onboarding/StepCelebration.tsx
git commit -m "feat(onboarding): add Step 4 prescription preview + Step 5 celebration"
```

---

## Task 8: Orchestrator Page

Rewrite the onboarding page to orchestrate all 5 steps.

**Files:**
- Modify: `app/[locale]/onboarding/page.tsx` (complete rewrite)

- [ ] **Step 1: Rewrite `app/[locale]/onboarding/page.tsx`**

The orchestrator manages:
- `step` state (1-5)
- `profileData` collected from Step 2 (specialty, degrees, regNumber, regCouncil)
- `doctorName` from Supabase auth (fetched on mount)
- `handleFinish()` that saves to `larinova_doctors` and redirects

Structure:
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ParticleDust } from "@/components/onboarding/ParticleDust";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepMotivation } from "@/components/onboarding/StepMotivation";
import { StepProfile } from "@/components/onboarding/StepProfile";
import { StepMagic } from "@/components/onboarding/StepMagic";
import { StepPrescription } from "@/components/onboarding/StepPrescription";
import { StepCelebration } from "@/components/onboarding/StepCelebration";
import { ArrowLeft } from "lucide-react";

// ... state management, step rendering with AnimatePresence,
// back button (steps 2-4), handleFinish DB save
```

The `handleFinish` function (preserve upsert pattern from existing code):
- Gets auth user via `supabase.auth.getUser()`
- Checks if doctor record exists: `supabase.from("larinova_doctors").select("id").eq("user_id", user.id).single()`
- If exists: `update()` with `specialization`, `degrees`, `registration_number`, `registration_council`, `language: "en"`, `onboarding_completed: true`
- If not exists: `insert()` with above + `user_id`, `full_name` (from `user.user_metadata?.full_name || email prefix`), `email`
- Redirects to `/en` (dashboard)

Step transitions use `AnimatePresence` with `mode="wait"`:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={step}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.3 }}
  >
    {/* current step component */}
  </motion.div>
</AnimatePresence>
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds, `/[locale]/onboarding` route visible.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/onboarding/page.tsx
git commit -m "feat(onboarding): rewrite orchestrator with 5-step animated flow"
```

---

## Parallel Execution Map

```
Task 1 (Sarvam API)  ─┐
Task 2 (Shared UI)    ─┼─→ Task 6 (Step 3 — depends on Task 1 + 2 + 3)
Task 3 (Audio Hook)   ─┘
Task 4 (Step 1)       ─────→ Task 8 (Orchestrator — depends on all steps)
Task 5 (Step 2)       ─────→ Task 8
Task 7 (Steps 4 & 5)  ─────→ Task 8
```

**Independent tasks (can run in parallel):** Tasks 1, 2, 3, 4, 5, 7
**Dependent tasks:** Task 6 (needs 1+2+3), Task 8 (needs all)

**Deferred:** Refactoring `TranscriptionViewSarvam.tsx` to consume `useAudioRecorder` — done as a separate follow-up to avoid risk to existing consultation flows during this sprint.
