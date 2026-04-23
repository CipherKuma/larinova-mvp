"use client";

import { useEffect, useRef } from "react";

interface StepTransitionBurstProps {
  trigger: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

export function StepTransitionBurst({ trigger }: StepTransitionBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevRef = useRef(trigger);

  useEffect(() => {
    if (trigger === prevRef.current) return;
    prevRef.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const sparks: Spark[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      const isEmerald = Math.random() > 0.3;
      sparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2,
        alpha: 0.7,
        decay: 0.02 + Math.random() * 0.015,
        color: isEmerald ? "16,185,129" : "255,255,255",
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const s of sparks) {
        if (s.alpha <= 0) continue;
        alive = true;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.98;
        s.vy *= 0.98;
        s.alpha -= s.decay;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color},${Math.max(0, s.alpha)})`;
        ctx.fill();
      }

      if (alive) {
        animId = requestAnimationFrame(animate);
      }
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30"
    />
  );
}
