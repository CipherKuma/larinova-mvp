"use client";

import { useState, useEffect } from "react";

const ehrSystems = [
  { name: "Epic", color: "bg-blue-500", connected: true },
  { name: "Cerner", color: "bg-orange-500", connected: false },
  { name: "Allscripts", color: "bg-purple-500", connected: false },
];

const syncSteps = [
  { label: "Authenticating", complete: true },
  { label: "Validating note", complete: true },
  { label: "Syncing to EHR", complete: false },
  { label: "Confirming receipt", complete: false },
];

export function EHRSyncUI() {
  const [progress, setProgress] = useState(0);
  const [synced, setSynced] = useState(false);
  const currentStep =
    progress < 25 ? 0 : progress < 50 ? 1 : progress < 75 ? 2 : 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSynced(true);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-border/50 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <span className="text-foreground text-sm font-medium">
            Push to EHR
          </span>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
            synced ? "bg-accent/10 text-accent" : "bg-blue-100 text-blue-700"
          }`}
        >
          {synced ? "Complete!" : "Syncing..."}
        </span>
      </div>

      {/* Connected EHR */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-6 border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
            Connected System
          </span>
          <span className="text-accent text-xs flex items-center gap-1 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          {ehrSystems.map((ehr, index) => (
            <div
              key={index}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                ehr.connected
                  ? "bg-primary/5 border-primary/30 shadow-sm"
                  : "bg-secondary/30 border-transparent opacity-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${ehr.color} flex items-center justify-center mb-2`}
              >
                <span className="text-white text-xs font-bold">
                  {ehr.name.charAt(0)}
                </span>
              </div>
              <span className="text-foreground text-xs font-medium">
                {ehr.name}
              </span>
              {ehr.connected && (
                <svg
                  className="w-3 h-3 text-accent mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-xs font-medium">
            Upload Progress
          </span>
          <span className="text-foreground text-sm font-mono font-semibold">
            {progress}%
          </span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Sync Steps */}
      <div className="bg-primary/5 rounded-xl p-4 mb-6 border border-primary/10">
        <div className="space-y-3">
          {syncSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  index < currentStep
                    ? "bg-accent"
                    : index === currentStep
                      ? "bg-primary animate-pulse"
                      : "bg-secondary"
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : index === currentStep ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                )}
              </div>
              <span
                className={`text-sm ${
                  index <= currentStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {index < currentStep && (
                <span className="text-accent text-xs ml-auto font-medium">
                  Done
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Success State */}
      {synced && (
        <div className="bg-accent/10 rounded-xl p-4 border border-accent/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">
                Successfully Synced!
              </p>
              <p className="text-muted-foreground text-xs">
                Note saved to Epic • Patient Chart Updated
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
