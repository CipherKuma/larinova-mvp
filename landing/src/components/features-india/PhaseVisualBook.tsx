"use client";

import { motion } from "framer-motion";

const slots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
];

export function PhaseVisualBook() {
  return (
    <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/85 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Dr. Priya Iyer · General Physician
          </div>
          <div className="mt-1 font-display text-sm font-semibold text-foreground">
            Tuesday, 23 April
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] text-muted-foreground">
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((s, i) => {
          const booked = i === 2 || i === 4 || i === 7;
          const picked = i === 5;
          return (
            <motion.div
              key={s}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={`relative rounded-lg border px-3 py-2.5 text-center font-mono text-xs transition-colors ${
                picked
                  ? "border-primary bg-primary/10 text-primary"
                  : booked
                    ? "border-border/60 bg-muted/30 text-muted-foreground/40 line-through"
                    : "border-border bg-background/50 text-foreground/80"
              }`}
            >
              {s}
              {picked && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
        className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-3"
      >
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Confirmed
        </div>
        <div className="mt-1 text-sm text-foreground">
          12:30 — Ravi Kumar · Fever, 2 days
        </div>
        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-400" /> WhatsApp
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-sky-400" /> SMS
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-amber-400" /> Email
          </span>
        </div>
      </motion.div>
    </div>
  );
}
