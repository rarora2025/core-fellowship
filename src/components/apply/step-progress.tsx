"use client";

import { motion } from "framer-motion";

import { easeOutSoft } from "@/components/motion/easing";
import { cn } from "@/lib/utils";

/** Thin segmented bar with the step names underneath. */
export function StepProgress({ steps, current }: { steps: readonly { title: string }[]; current: number }) {
  return (
    <nav aria-label="Application progress">
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li key={step.title} aria-current={state === "current" ? "step" : undefined}>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={false}
                  animate={{ scaleX: state === "todo" ? 0 : 1 }}
                  transition={{ duration: 0.9, ease: easeOutSoft }}
                  className="h-full origin-left rounded-full bg-brand"
                />
              </div>
              <span
                className={cn(
                  "mt-2 hidden text-[12px] transition-colors duration-500 sm:block",
                  state === "todo" ? "text-subtle-foreground" : "text-foreground"
                )}
              >
                {step.title}
              </span>
              <span className="sr-only">
                {state === "done" ? " (done)" : state === "current" ? " (current step)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
