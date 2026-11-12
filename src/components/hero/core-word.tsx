"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * "CORE" set like the logo: logo blue, with two lightbulb lines under the O.
 * After the title lands, the lines grow out from the center one after the
 * other, then the O glows once, like the bulb switching on.
 */
export function CoreWord({ delay = 1.0 }: { delay?: number }) {
  const reduce = useReducedMotion();
  const bars = [
    { w: "0.42em", top: "0" },
    { w: "0.28em", top: "0.14em" },
  ];
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <span className="text-brand-logo">
      C
      <span className="relative inline-block">
        <motion.span
          className="inline-block"
          initial={false}
          animate={
            reduce
              ? undefined
              : {
                  textShadow: [
                    "0 0 0px rgba(84,161,255,0)",
                    "0 0 28px rgba(84,161,255,0.65)",
                    "0 0 0px rgba(84,161,255,0)",
                  ],
                }
          }
          transition={{ duration: 1.4, ease: "easeInOut", delay: delay + 0.75 }}
        >
          O
        </motion.span>
        <span aria-hidden="true" className="absolute left-1/2 top-[0.99em] block h-[0.22em] w-[0.42em] -translate-x-1/2">
          {bars.map((b, i) => (
            <motion.span
              key={i}
              initial={{ scaleX: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.55, ease, delay: reduce ? 0 : delay + i * 0.18 }}
              style={{ width: b.w, top: b.top }}
              className="absolute left-1/2 block h-[0.065em] -translate-x-1/2 rounded-full bg-current"
            />
          ))}
        </span>
      </span>
      RE
    </span>
  );
}
