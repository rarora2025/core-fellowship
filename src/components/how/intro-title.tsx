"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeOutSoft } from "@/components/motion/easing";

/** Page title that rises word by word from behind a mask, slowly. */
export function IntroTitle({ id, text }: { id: string; text: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <h1
      id={id}
      className="mt-6 max-w-[16ch] text-[clamp(2.75rem,1.3rem+5vw,6rem)] font-medium leading-[1.0] tracking-[-0.045em]"
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
            <motion.span
              className="inline-block"
              initial={reduce ? { opacity: 0 } : { y: "110%" }}
              animate={reduce ? { opacity: 1 } : { y: "0%" }}
              transition={{ duration: reduce ? 0.3 : 1.4, ease: easeOutSoft, delay: reduce ? 0 : 0.3 + i * 0.09 }}
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  );
}
