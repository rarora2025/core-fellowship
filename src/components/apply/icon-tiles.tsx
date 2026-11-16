"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  Check,
  Clapperboard,
  Code2,
  Coins,
  Cpu,
  FlaskConical,
  GraduationCap,
  Handshake,
  HeartPulse,
  Landmark,
  Leaf,
  LineChart,
  Megaphone,
  PenTool,
  Settings2,
  ShoppingBag,
  Shuffle,
  Sparkles,
  Store,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import { easeOutSoft } from "@/components/motion/easing";
import { cn } from "@/lib/utils";

export const interestIcons: Record<string, LucideIcon> = {
  AI: Sparkles,
  Fintech: Landmark,
  Climate: Leaf,
  Health: HeartPulse,
  Consumer: ShoppingBag,
  "Developer tools": Terminal,
  Education: GraduationCap,
  Media: Clapperboard,
  Marketplaces: Store,
  Hardware: Cpu,
  Crypto: Coins,
  "Open to anything": Shuffle,
};

export const roleIcons: Record<string, LucideIcon> = {
  "Software engineering": Code2,
  Product: Boxes,
  Design: PenTool,
  Data: BarChart3,
  "Growth and marketing": Megaphone,
  Operations: Settings2,
  "Sales and partnerships": Handshake,
  Finance: LineChart,
  Research: FlaskConical,
};

/** Multi-select grid of icon tiles. */
export function IconTiles({
  options,
  icons,
  value,
  onChange,
  describedBy,
}: {
  options: string[];
  icons: Record<string, LucideIcon>;
  value: string[];
  onChange: (v: string[]) => void;
  describedBy?: string;
}) {
  const reduce = !!useReducedMotion();
  return (
    <div
      role="group"
      aria-labelledby="question"
      aria-describedby={describedBy}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {options.map((option, i) => {
        const on = value.includes(option);
        const Icon = icons[option] ?? Sparkles;
        return (
          <motion.button
            key={option}
            id={i === 0 ? "answer" : undefined}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== option) : [...value, option])}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutSoft, delay: 0.2 + i * 0.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative flex min-h-[56px] flex-row items-center gap-2.5 rounded-xl border p-2.5 pr-7 text-left sm:min-h-[84px] sm:flex-col sm:items-start sm:justify-between sm:gap-3 sm:p-3 sm:pr-3 outline-none transition-[background-color,border-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
              on
                ? "border-cta/60 bg-columbia-soft text-foreground"
                : "border-input text-muted-foreground hover:border-columbia hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-300",
                on ? "bg-cta text-cta-foreground" : "bg-muted text-foreground/70"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-[13.5px] font-medium leading-tight">{option}</span>
            <AnimatePresence>
              {on && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.35, ease: easeOutSoft }}
                  className="absolute right-2 top-2 grid size-5 sm:right-2.5 sm:top-2.5 place-items-center rounded-full bg-cta text-cta-foreground"
                >
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
