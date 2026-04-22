"use client";

import { motion } from "framer-motion";

type Message = {
  from: "bot" | "patient";
  body: string;
  meta?: string;
  delay: number;
};

const thread: Message[] = [
  {
    from: "bot",
    body: "Hi Ravi, it's Larinova checking in for Dr. Priya. How's the fever today?",
    meta: "Day 1 · 10:00",
    delay: 0.1,
  },
  {
    from: "patient",
    body: "Better dr. 99.2 this morning.",
    meta: "10:06",
    delay: 0.55,
  },
  {
    from: "bot",
    body: "Great — appetite and fluids OK?",
    meta: "10:06",
    delay: 1.0,
  },
  {
    from: "patient",
    body: "Eating fine now.",
    meta: "10:09",
    delay: 1.4,
  },
];

export function PhaseVisualFollowUp() {
  return (
    <div className="relative w-full max-w-sm rounded-[28px] border border-border bg-[#0b141a] p-3 shadow-[0_20px_60px_-20px_rgba(239,68,68,0.25)]">
      <div className="mb-2 flex items-center gap-2 rounded-t-[20px] bg-[#202c33] px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
          L
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Larinova</div>
          <div className="font-mono text-[10px] text-white/50">
            for Dr. Priya Iyer
          </div>
        </div>
        <svg
          className="h-4 w-4 text-white/60"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 17.17L18.83 16H4V4h16v13.17zM20 2H4c-1.1 0-2 .9-2 2v16l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </div>

      <div
        className="space-y-2 rounded-b-[20px] px-3 py-4"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.04), transparent 60%), radial-gradient(circle at 80% 80%, rgba(239,68,68,0.05), transparent 60%)",
        }}
      >
        {thread.map((m, i) => {
          const isBot = m.from === "bot";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: m.delay, duration: 0.4 }}
              className={`flex ${isBot ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[78%] rounded-lg px-2.5 py-1.5 text-sm ${
                  isBot
                    ? "rounded-bl-sm bg-[#202c33] text-white"
                    : "rounded-br-sm bg-[#005c4b] text-white"
                }`}
              >
                <div className="leading-snug">{m.body}</div>
                {m.meta && (
                  <div className="mt-0.5 text-right font-mono text-[9px] text-white/50">
                    {m.meta}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.9, duration: 0.4 }}
          className="flex items-center gap-2 pt-1.5"
        >
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
            Outcome · improving
          </span>
          <span className="font-mono text-[10px] text-white/40">
            Next check-in: day 3
          </span>
        </motion.div>
      </div>
    </div>
  );
}
