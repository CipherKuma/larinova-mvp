"use client";

import { motion } from "framer-motion";

export function PhaseVisualPrep() {
  return (
    <div className="relative w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-[0_20px_60px_-20px_rgba(168,85,247,0.25)] backdrop-blur-sm"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-purple-400">
              Prep brief · 60s read
            </div>
            <div className="mt-1 font-display text-base font-semibold text-foreground">
              Ravi Kumar, 52 · Fever + body ache
            </div>
          </div>
          <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-400">
            RED FLAG
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mb-4 space-y-2 text-sm text-foreground/90"
        >
          <p>
            <span className="font-semibold text-purple-300">Summary.</span>{" "}
            Type-II diabetic on metformin, febrile x 2 days, 101.4°F this
            morning. Known sulfa allergy.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3"
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-red-400">
            Watch for
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-foreground/80">
            <li>• Hypoglycemia risk if appetite low</li>
            <li>• Dengue serology pending (lab photo uploaded)</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="rounded-lg border border-border bg-background/50 p-3"
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Suggested questions
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-foreground/80">
            <li>— Any petechiae or retro-orbital pain?</li>
            <li>— Fasting glucose this week?</li>
            <li>— Urinary frequency change?</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
