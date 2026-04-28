"use client";

import { motion } from "framer-motion";

const fields = [
  { label: "Chief complaint", value: "Fever + body ache, 2 days", delay: 0 },
  { label: "Temperature (°F)", value: "101.4", delay: 0.25 },
  {
    label: "Prior history",
    value: "Type II diabetes · Metformin 500mg",
    delay: 0.5,
  },
  { label: "Allergies", value: "Sulfa drugs", delay: 0.75 },
];

export function PhaseVisualIntake() {
  return (
    <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/85 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-sky-400">
            Intake · Ravi Kumar
          </div>
          <div className="mt-1 font-display text-sm font-semibold text-foreground">
            Before your 12:30 visit
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20">
          <svg
            className="h-4 w-4 text-sky-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: f.delay, duration: 0.4 }}
            className="rounded-lg border border-border bg-background/50 px-3 py-2.5"
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {f.label}
            </div>
            <div className="mt-1 text-sm text-foreground">
              <TypewriterText text={f.value} delay={f.delay + 0.2} />
              {i === fields.length - 1 && (
                <motion.span
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-sky-400"
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
        className="mt-5 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2"
      >
        <svg
          className="h-3.5 w-3.5 text-sky-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <div className="text-xs text-foreground/80">
          Larinova: &ldquo;Can you share a photo of the lab report?&rdquo;
        </div>
      </motion.div>
    </div>
  );
}

function TypewriterText({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.span
      initial={{ width: 0 }}
      whileInView={{ width: "100%" }}
      viewport={{ once: true }}
      transition={{ delay, duration: Math.min(1.2, 0.03 * text.length) }}
      className="inline-block overflow-hidden whitespace-nowrap align-bottom"
    >
      {text}
    </motion.span>
  );
}
