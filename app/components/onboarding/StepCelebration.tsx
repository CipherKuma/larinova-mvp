"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface StepCelebrationProps {
  doctorName: string;
  specialty: string;
  onComplete: () => void;
}

type ParticleShape = "circle" | "rect" | "star";

interface CParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  size: number;
  color: [number, number, number];
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  shape: ParticleShape;
  trail: boolean;
}

interface Ring {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: [number, number, number];
}

const COLORS: [number, number, number][] = [
  [16, 185, 129], // emerald
  [52, 211, 153], // lighter emerald
  [167, 243, 208], // pale emerald
  [255, 255, 255], // white
  [6, 182, 212], // cyan
  [20, 184, 166], // teal
];

const SHAPES: ParticleShape[] = ["circle", "circle", "rect", "star"];

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * 2 * i) / 4;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
  }
  ctx.stroke();
  ctx.restore();
}

export function StepCelebration({
  doctorName,
  specialty,
  onComplete,
}: StepCelebrationProps) {
  const t = useTranslations("onboarding.celebrationStep");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: CParticle[] = [];
    const rings: Ring[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    function spawnWave(count: number, speedMult: number, sizeBoost: number) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = (2.5 + Math.random() * 5) * speedMult;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        particles.push({
          x: cx,
          y: cy,
          prevX: cx,
          prevY: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 2 + Math.random() * 3 + sizeBoost,
          color,
          alpha: 1,
          decay: 0.008 + Math.random() * 0.006,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          shape,
          trail: Math.random() > 0.6,
        });
      }
      rings.push({
        radius: 10,
        maxRadius: 200 + Math.random() * 100,
        alpha: 0.6,
        color: COLORS[Math.floor(Math.random() * 3)],
      });
    }

    // Three staggered burst waves
    spawnWave(60, 1, 0);
    const t1 = setTimeout(() => spawnWave(40, 0.7, 1), 250);
    const t2 = setTimeout(() => spawnWave(30, 0.5, 0.5), 500);

    // Sparkle rain after bursts
    const t3 = setTimeout(() => {
      for (let i = 0; i < 40; i++) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        particles.push({
          x: Math.random() * canvas.width,
          y: -10 - Math.random() * 100,
          prevX: 0,
          prevY: 0,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1 + Math.random() * 2,
          size: 1.5 + Math.random() * 2,
          color,
          alpha: 0.8,
          decay: 0.005 + Math.random() * 0.005,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          shape: "circle",
          trail: false,
        });
      }
    }, 700);

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      // Expanding rings
      for (const ring of rings) {
        if (ring.alpha <= 0) continue;
        alive = true;
        ring.radius += (ring.maxRadius - ring.radius) * 0.04;
        ring.alpha -= 0.01;

        const [r, g, b] = ring.color;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${Math.max(0, ring.alpha)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Particles
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.prevX = p.x;
        p.prevY = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.vx *= 0.995;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;

        const a = Math.max(0, p.alpha);
        const [r, g, b] = p.color;

        // Trail line
        if (p.trail && a > 0.1) {
          ctx.beginPath();
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${a * 0.3})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        // Shape rendering
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
          ctx.restore();
        } else if (p.shape === "star") {
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.lineWidth = 1;
          drawStar(ctx, p.x, p.y, p.size * 1.5, p.rotation);
        }
      }

      if (alive) {
        animId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Auto-redirect after 3s
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const words = t("readyDr", { name: doctorName }).split(" ");

  const hints = [t("hint0"), t("hint1"), t("hint2")];

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 text-center relative">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />

      <div className="relative z-20 pt-16">
        <h2 className="text-3xl font-bold mb-2">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="inline-block mr-2 bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent"
            >
              {word}
            </motion.span>
          ))}
        </h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-muted-foreground mb-12"
        >
          {specialty}
        </motion.p>

        <div className="space-y-3">
          {hints.map((hint, i) => (
            <motion.div
              key={hint}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.3 }}
              className="text-sm text-muted-foreground"
            >
              {hint}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="text-xs text-muted-foreground/50 mt-8"
        >
          {t("takingToDashboard")}
        </motion.p>
      </div>
    </div>
  );
}
