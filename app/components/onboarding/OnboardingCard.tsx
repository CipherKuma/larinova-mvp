"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  featured?: boolean;
  index?: number;
  className?: string;
}

export function OnboardingCard({
  selected,
  onClick,
  children,
  featured,
  index = 0,
  className,
}: OnboardingCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-xl p-5 cursor-pointer transition-all duration-200",
        "bg-card/50 border border-border/30",
        "hover:border-border/70 hover:bg-card/80 hover:shadow-md hover:shadow-primary/5",
        selected && "border-primary bg-primary/5 hover:border-primary",
        featured && !selected && "ring-1 ring-primary/20 bg-primary/[0.03]",
        className,
      )}
      whileTap={{ scale: 0.98 }}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
      {selected && (
        <motion.div
          initial={{
            opacity: 0.4,
            boxShadow: "0 0 0 0 rgba(16,185,129,0)",
          }}
          animate={{
            opacity: 0,
            boxShadow: "0 0 20px 5px rgba(16,185,129,0.2)",
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-xl pointer-events-none"
        />
      )}
      {children}
    </motion.button>
  );
}
