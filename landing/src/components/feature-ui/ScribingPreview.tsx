"use client";

import { useState, useEffect } from "react";

const transcriptPhrases = [
  "Patient reports chest pain...",
  "Started two days ago...",
  "Radiating to left arm...",
];

const waveformBars = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  delay: i * 40,
  scale: 0.35 + ((i * 11) % 13) / 20,
}));

export function ScribingPreview() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % transcriptPhrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full p-4 flex flex-col justify-center">
      {/* Waveform */}
      <div className="flex items-center justify-center gap-[3px] h-10 mb-3">
        {/* Recording indicator */}
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
        {waveformBars.map((bar) => (
          <div
            key={bar.id}
            className="w-1 bg-gradient-to-t from-primary to-accent rounded-full"
            style={{
              height: "100%",
              animation: `waveform 0.6s ease-in-out ${bar.delay}ms infinite alternate`,
              transform: `scaleY(${bar.scale})`,
            }}
          />
        ))}
      </div>

      {/* Live transcript */}
      <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
        <p className="text-sm text-foreground transition-all duration-300">
          {transcriptPhrases[textIndex]}
          <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
        </p>
      </div>

      <style jsx>{`
        @keyframes waveform {
          0% {
            transform: scaleY(0.3);
          }
          100% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}
