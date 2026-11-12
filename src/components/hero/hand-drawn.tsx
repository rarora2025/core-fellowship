"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Loose, hand-drawn accents for the hero title. Each is an SVG stroke that
 * draws itself in once, after the title lands, so it feels marked up by hand.
 */

const draw = (delay: number, duration = 0.9) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    pathLength: { duration, ease: [0.55, 0.1, 0.35, 1] as const, delay },
    opacity: { duration: 0.01, delay },
  },
});

/** Highlighter swipe behind a word: a rough band revealed left to right. */
export function Marker({ children, delay = 1.2 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block">
      <svg
        aria-hidden="true"
        viewBox="0 0 300 60"
        preserveAspectRatio="none"
        className="absolute -inset-x-[4%] bottom-[2%] top-[38%] -z-10 h-[62%] w-[108%] -rotate-[1.5deg]"
      >
        <defs>
          <clipPath id="marker-reveal">
            <motion.rect
              x="0"
              y="0"
              height="60"
              initial={{ width: reduce ? 300 : 0 }}
              animate={{ width: 300 }}
              transition={{ duration: 0.8, ease: [0.6, 0.05, 0.3, 1], delay: reduce ? 0 : delay }}
            />
          </clipPath>
        </defs>
        <path
          clipPath="url(#marker-reveal)"
          d="M4 14 C 60 6, 140 12, 296 4 L 292 22 C 296 34, 294 46, 298 54 C 210 58, 120 50, 8 58 C 2 44, 10 30, 4 14 Z"
          fill="var(--marker)"
          opacity="0.8"
        />
      </svg>
      {children}
    </span>
  );
}

/** Two quick pen strokes under a word. */
export function Underline({ children, delay = 1.2 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  const d = reduce ? 0 : delay;
  return (
    <span className="relative inline-block">
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 300 30"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.28em] left-[-2%] h-[0.38em] w-[104%] overflow-visible"
      >
        <motion.path
          d="M4 18 C 70 10, 150 8, 296 12"
          fill="none"
          stroke="var(--brand-deep)"
          strokeWidth="5"
          strokeLinecap="round"
          {...draw(d, 0.6)}
        />
        <motion.path
          d="M30 26 C 110 18, 200 18, 270 22"
          fill="none"
          stroke="var(--brand-deep)"
          strokeWidth="3.5"
          strokeLinecap="round"
          {...draw(d + 0.45, 0.5)}
        />
      </svg>
    </span>
  );
}

/** A loose pen loop around a word that overshoots where it closes. */
export function Circle({ children, delay = 1.2 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block">
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-[16%] -inset-y-[30%] h-[160%] w-[132%] overflow-visible"
      >
        <motion.path
          d="M120 8 C 60 2, 8 18, 10 52 C 12 86, 80 98, 140 92 C 190 86, 198 46, 182 26 C 166 8, 110 4, 70 14"
          fill="none"
          stroke="var(--brand-deep)"
          strokeWidth="3"
          strokeLinecap="round"
          {...draw(reduce ? 0 : delay, 1.1)}
        />
      </svg>
    </span>
  );
}

/** A handwritten note above the title with a little arrow pointing down. */
export function Note({ delay = 1.2 }: { delay?: number }) {
  const reduce = useReducedMotion();
  const d = reduce ? 0 : delay;
  return (
    <span aria-hidden="true" className="pointer-events-none mb-2 flex items-end justify-center gap-1 text-brand-deep">
      <motion.span
        initial={{ opacity: 0, y: reduce ? 0 : 4, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.6, delay: d }}
        className="font-hand text-[clamp(1.4rem,1.1rem+1vw,1.9rem)] leading-none"
      >
        students × startups
      </motion.span>
      <svg viewBox="0 0 60 60" className="h-10 w-10 translate-y-4 overflow-visible">
        <motion.path
          d="M6 8 C 30 4, 46 18, 42 46"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          {...draw(d + 0.4, 0.6)}
        />
        <motion.path
          d="M32 38 L 42 48 L 50 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...draw(d + 0.9, 0.3)}
        />
      </svg>
    </span>
  );
}
