"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * "CORE" set like the logo: logo blue, with the three lightbulb lines
 * under the O. The lines slide in one by one after the title lands.
 */
export function CoreWord({ delay = 0.9 }: { delay?: number }) {
  const reduce = useReducedMotion();
  const bars = ["w-[0.42em]", "w-[0.42em]", "w-[0.24em]"];
  return (
    <span className="text-brand-logo">
      C
      <span className="relative inline-block">
        O
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[0.86em] flex -translate-x-1/2 flex-col items-center gap-[0.05em]"
        >
          {bars.map((w, i) => (
            <motion.span
              key={i}
              initial={{ scaleX: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay + i * 0.12 }}
              className={`block h-[0.065em] rounded-full bg-current ${w}`}
            />
          ))}
        </span>
      </span>
      RE
    </span>
  );
}
