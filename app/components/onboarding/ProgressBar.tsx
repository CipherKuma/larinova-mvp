"use client";

import { useEffect, useRef } from "react";

interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
}

export function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  const percentage = (step / totalSteps) * 100;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    currentPct: percentage,
    sparks: [] as Spark[],
    animId: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = 32;

    const state = stateRef.current;
    state.currentPct = state.currentPct || 0;
    const targetPct = percentage;

    cancelAnimationFrame(state.animId);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ease toward target
      const diff = targetPct - state.currentPct;
      if (Math.abs(diff) > 0.1) {
        state.currentPct += diff * 0.05;
      } else {
        state.currentPct = targetPct;
      }

      const leadX = (state.currentPct / 100) * canvas.width;

      // Emit sparks while bar is moving
      if (Math.abs(diff) > 0.5) {
        for (let i = 0; i < 2; i++) {
          state.sparks.push({
            x: leadX,
            y: 4 + Math.random() * 2,
            vx: (Math.random() - 0.3) * 2,
            vy: (Math.random() - 0.5) * 2.5,
            size: 1 + Math.random() * 1.5,
            alpha: 0.8 + Math.random() * 0.2,
            decay: 0.025 + Math.random() * 0.02,
          });
        }
      }

      // Draw & update sparks
      for (let i = state.sparks.length - 1; i >= 0; i--) {
        const s = state.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.06;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          state.sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${Math.max(0, s.alpha)})`;
        ctx.fill();
      }

      if (state.sparks.length > 0 || Math.abs(diff) > 0.5) {
        state.animId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(state.animId);
  }, [percentage]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-muted/30">
        <div
          className="h-full bg-primary rounded-r-full"
          style={{
            width: `${percentage}%`,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{ height: 32, marginTop: -14 }}
      />
    </div>
  );
}
