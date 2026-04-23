"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  speedX: number;
  speedY: number;
  isEmerald: boolean;
  isOrb: boolean;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
}

export function ParticleDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const particles: Particle[] = [];

    // Small floating particles
    for (let i = 0; i < 80; i++) {
      const isEmerald = Math.random() > 0.35;
      particles.push({
        x: 0,
        y: 0,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        size: 1 + Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2 - 0.1,
        isEmerald,
        isOrb: false,
        alpha: 0,
        baseAlpha: 0.3 + Math.random() * 0.4,
        twinkleSpeed: 0.01 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI * 2,
        orbitRadius: 30 + Math.random() * 60,
        orbitSpeed: 0.0003 + Math.random() * 0.0008,
      });
    }

    // Slower drifting particles (slightly larger but no glow)
    for (let i = 0; i < 8; i++) {
      const isEmerald = Math.random() > 0.3;
      particles.push({
        x: 0,
        y: 0,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        size: 2 + Math.random() * 1.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.1,
        isEmerald,
        isOrb: true,
        alpha: 0,
        baseAlpha: 0.2 + Math.random() * 0.15,
        twinkleSpeed: 0.005 + Math.random() * 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI * 2,
        orbitRadius: 50 + Math.random() * 100,
        orbitSpeed: 0.0001 + Math.random() * 0.0004,
      });
    }

    let time = 0;
    let animId: number;

    const animate = () => {
      time++;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update & draw particles
      for (const p of particles) {
        // Orbital movement around drifting base
        p.angle += p.orbitSpeed;
        p.x =
          p.baseX +
          Math.cos(p.angle) * p.orbitRadius +
          Math.sin(time * 0.001 + p.twinklePhase) * 15;
        p.y =
          p.baseY +
          Math.sin(p.angle) * p.orbitRadius * 0.6 +
          Math.cos(time * 0.0008 + p.twinklePhase) * 10;

        // Drift base position slowly
        p.baseX += p.speedX;
        p.baseY += p.speedY;

        // Wrap around edges
        if (p.baseX < -50) p.baseX = w + 50;
        if (p.baseX > w + 50) p.baseX = -50;
        if (p.baseY < -50) p.baseY = h + 50;
        if (p.baseY > h + 50) p.baseY = -50;

        // Mouse parallax — gentle repulsion
        const dx = mx - p.x;
        const dy = my - p.y;
        const distSq = dx * dx + dy * dy;
        const radius = 250;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          const force = (radius - dist) / radius;
          const strength = p.isOrb ? 0.025 : 0.015;
          p.x -= dx * force * strength;
          p.y -= dy * force * strength;
        }

        // Twinkle
        p.alpha =
          p.baseAlpha + Math.sin(time * p.twinkleSpeed + p.twinklePhase) * 0.2;
        p.alpha = Math.max(0.05, Math.min(1, p.alpha));

        // Draw — solid dots, no glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isOrb ? p.size : p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isEmerald
          ? `rgba(16,185,129,${p.alpha})`
          : `rgba(255,255,255,${p.alpha * 0.6})`;
        ctx.fill();
      }

      // Constellation connection lines between nearby particles
      const threshold = 100;
      const thresholdSq = threshold * threshold;
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].isOrb) continue;
        for (let j = i + 1; j < particles.length; j++) {
          if (particles[j].isOrb) continue;
          const a = particles[i];
          const b = particles[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const dSq = ddx * ddx + ddy * ddy;
          if (dSq < thresholdSq) {
            const opacity = (1 - dSq / thresholdSq) * 0.1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(16,185,129,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0, backgroundColor: "#0a0f1e" }}
    >
      <div className="grain" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
