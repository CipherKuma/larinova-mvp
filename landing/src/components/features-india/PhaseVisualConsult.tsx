"use client";

import { motion } from "framer-motion";

const transcript = [
  { speaker: "Dr", text: "Jwaram evveLo neram iruku?", delay: 0.1 },
  { speaker: "Pt", text: "Rendu naal, 101 degree varaikum.", delay: 0.45 },
  {
    speaker: "Dr",
    text: "Paracetamol 500mg TDS, CBC and dengue NS1 eduthukkonga.",
    delay: 0.85,
  },
];

const bars = Array.from({ length: 28 }, (_, i) => i);

export function PhaseVisualConsult() {
  return (
    <div className="relative w-full max-w-md space-y-3">
      <div className="rounded-2xl border border-amber-500/30 bg-card/70 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="block h-2 w-2 rounded-full bg-red-500"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/80">
              Recording · 01:42
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            Tamil · English
          </span>
        </div>

        <div className="flex h-10 items-center justify-between gap-0.5 overflow-hidden">
          {bars.map((i) => (
            <motion.span
              key={i}
              className="block w-1 rounded-sm bg-amber-400"
              animate={{
                scaleY: [
                  0.4 + Math.random() * 0.6,
                  0.2 + Math.random() * 0.8,
                  0.3 + Math.random() * 0.7,
                ],
              }}
              transition={{
                duration: 0.7 + Math.random() * 0.5,
                repeat: Infinity,
                delay: i * 0.03,
                ease: "easeInOut",
              }}
              style={{ height: "100%", transformOrigin: "center" }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5 rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-sm">
        {transcript.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: line.delay, duration: 0.35 }}
            className="text-sm"
          >
            <span
              className={`font-mono text-[10px] uppercase tracking-wider ${
                line.speaker === "Dr" ? "text-amber-400" : "text-sky-400"
              }`}
            >
              {line.speaker}
            </span>{" "}
            <span className="text-foreground/85">{line.text}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
      >
        <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
          SOAP · drafted
        </div>
        <div className="space-y-1 text-xs">
          <div>
            <span className="font-mono font-bold text-emerald-400">A: </span>
            <span className="text-foreground/80">
              Acute febrile illness · rule out dengue
            </span>
          </div>
          <div>
            <span className="font-mono font-bold text-emerald-400">P: </span>
            <span className="text-foreground/80">
              Paracetamol 500mg TDS x 3d · CBC, NS1 today
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
