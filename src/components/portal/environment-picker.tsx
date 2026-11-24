"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { easeOutSoft } from "@/components/motion/easing";
import { environmentPairs } from "@/content/profile";
import type { EnvironmentChoice, StudentProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

/**
 * Four this-or-that rows, each a three-way segmented control
 * (left / either / right), styled like the homepage's
 * student/startup switch.
 */
export function EnvironmentPicker({
  value,
  onChange,
  describedBy,
}: {
  value: StudentProfile["environment"];
  onChange: (v: StudentProfile["environment"]) => void;
  describedBy?: string;
}) {
  const reduce = !!useReducedMotion();
  return (
    <div role="group" aria-labelledby="question" aria-describedby={describedBy} className="flex flex-col gap-2.5">
      {environmentPairs.map((pair, row) => {
        const options: { v: EnvironmentChoice; label: string }[] = [
          { v: "left", label: pair.left },
          { v: "either", label: "Either" },
          { v: "right", label: pair.right },
        ];
        const current = value[pair.key];
        return (
          <motion.div
            key={pair.key}
            role="radiogroup"
            aria-label={`${pair.left} or ${pair.right}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutSoft, delay: 0.2 + row * 0.05 }}
            className="relative grid grid-cols-[1fr_auto_1fr] rounded-2xl bg-muted p-1"
          >
            {options.map((o, i) => {
              const on = current === o.v;
              return (
                <button
                  key={o.v}
                  id={row === 0 && i === 0 ? "answer" : undefined}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange({ ...value, [pair.key]: o.v })}
                  className={cn(
                    "relative z-0 h-11 rounded-xl px-3 text-[14px] outline-none transition-colors duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    o.v === "either" && "px-4 text-[13px]",
                    on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId={`env-${pair.key}`}
                      transition={{ duration: reduce ? 0 : 0.45, ease: easeOutSoft }}
                      className="absolute inset-0 -z-10 rounded-xl bg-card shadow-[0_1px_2px_rgb(var(--shadow-color)/0.12)] dark:bg-secondary"
                    />
                  )}
                  {o.label}
                </button>
              );
            })}
          </motion.div>
        );
      })}
    </div>
  );
}
