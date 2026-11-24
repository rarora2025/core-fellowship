"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The lightbulb from the CORE logo: the O, with two lines under it.
 * With `lightUp`, the lines draw in and the bulb glows once, like it
 * switching on. Takes the current text colour.
 */
export function CoreBulb({ className, lightUp = false, delay = 0.2 }: { className?: string; lightUp?: boolean; delay?: number }) {
  const reduce = !!useReducedMotion();
  const animate = lightUp && !reduce;
  const line = (i: number) => ({
    initial: animate ? { pathLength: 0, opacity: 0 } : false,
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: delay + 0.35 + i * 0.15 },
  });
  return (
    <svg viewBox="0 0 48 64" fill="none" aria-hidden="true" className={className}>
      <motion.circle
        cx="24"
        cy="22"
        r="17"
        stroke="currentColor"
        strokeWidth="4.5"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      />
      {animate && (
        <motion.circle
          cx="24"
          cy="22"
          r="17"
          fill="currentColor"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.28, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: delay + 0.8 }}
        />
      )}
      <motion.path d="M13 49 H35" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" {...line(0)} />
      <motion.path d="M18 58 H30" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" {...line(1)} />
    </svg>
  );
}
