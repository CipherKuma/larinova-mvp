"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
}

export function WarpField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const stars: Star[] = [];

    const seed = (count: number) => {
      stars.length = 0;
      for (let i = 0; i < count; i++) {
        const speed = 0.4 + Math.random() * 2.6;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          speed,
          length: 8 + speed * 22,
          alpha: 0.08 + Math.random() * 0.18,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = Math.max(36, Math.min(80, Math.floor(width / 22)));
      seed(density);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const tailX = s.x - s.length;
        const grad = ctx.createLinearGradient(tailX, s.y, s.x, s.y);
        grad.addColorStop(0, "rgba(180, 230, 210, 0)");
        grad.addColorStop(1, `rgba(180, 230, 210, ${s.alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.speed > 1.8 ? 1.1 : 0.7;
        ctx.beginPath();
        ctx.moveTo(tailX, s.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        s.x += s.speed;
        if (s.x - s.length > width) {
          s.x = -s.length;
          s.y = Math.random() * height;
          s.speed = 0.4 + Math.random() * 2.6;
          s.length = 8 + s.speed * 22;
          s.alpha = 0.08 + Math.random() * 0.18;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    if (!reduced) raf = requestAnimationFrame(tick);
    else {
      // Static field for reduced-motion users — draw once.
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx.fillStyle = `rgba(180, 230, 210, ${s.alpha * 0.7})`;
        ctx.fillRect(s.x, s.y, 1.2, 1.2);
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none h-full w-full ${className || "absolute inset-0"}`}
      style={{ mixBlendMode: "screen" }}
    />
  );
}
