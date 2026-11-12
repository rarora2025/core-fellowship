"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeOutSoft } from "@/components/motion/easing";

/** Slow rise-and-fade when the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 10,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "p" | "h1" | "h2" | "li";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: reduce ? 0.3 : 1.4, ease: easeOutSoft, delay: reduce ? 0 : delay }}
      className={className}
    >
      {children}
    </Comp>
  );
}
