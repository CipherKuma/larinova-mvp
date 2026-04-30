"use client";

import { useState, useEffect } from "react";

const waveformBars = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  height: 24 + ((i * 37) % 56),
  delay: i * 50,
}));

export function VoiceRecorderUI() {
  const [isRecording, setIsRecording] = useState(true);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-border/50 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-500 text-sm font-medium">Recording</span>
        </div>
        <span className="text-muted-foreground text-sm font-mono">
          {formatTime(time)}
        </span>
      </div>

      {/* Patient Info */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-6 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-foreground font-medium text-sm">Sarah Johnson</p>
            <p className="text-muted-foreground text-xs">
              Follow-up Visit • Room 204
            </p>
          </div>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="bg-primary/5 rounded-xl p-4 mb-6 border border-primary/10">
        <div className="flex items-center justify-center gap-[2px] h-16">
          {waveformBars.map((bar) => (
            <div
              key={bar.id}
              className="w-1 bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-150"
              style={{
                height: `${bar.height}%`,
                animation: isRecording
                  ? `waveform 0.5s ease-in-out ${bar.delay}ms infinite alternate`
                  : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Live Transcript Preview */}
      <div className="bg-secondary/30 rounded-xl p-4 mb-6 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Live Transcript
          </span>
        </div>
        <p className="text-foreground text-sm leading-relaxed">
          <span className="text-primary">
            &quot;...the pain started about three weeks ago
          </span>
          <span className="animate-pulse text-primary">|</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
              : "bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30"
          }`}
        >
          {isRecording ? (
            <div className="w-5 h-5 rounded-sm bg-white" />
          ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        <button className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent hover:text-accent transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes waveform {
          0% {
            transform: scaleY(0.5);
          }
          100% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}
