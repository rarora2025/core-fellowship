"use client";

import { motion, useReducedMotion } from "framer-motion";

import { StartCard } from "@/components/hero/start-card";
import { easeOutSoft } from "@/components/motion/easing";
import { heroContent } from "@/content/site";

/**
 * Quiet, centered hero. The only "visual" is the real thing:
 * the card where an application starts.
 */
export function Hero() {
  const reduce = !!useReducedMotion();
  const rise = (delay: number, y = 16) => ({
    initial: { opacity: 0, y: reduce ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.3 : 1.6, ease: easeOutSoft, delay: reduce ? 0 : delay },
  });

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 pb-16 pt-28 sm:px-8"
    >
      <div className="flex w-full max-w-[560px] flex-col items-center text-center">
        <motion.p {...rise(0.3, 8)} className="text-[13px] text-muted-foreground">
          {heroContent.kicker}
        </motion.p>

        <motion.h1
          id="hero-heading"
          {...rise(0.55, 20)}
          className="mt-5 text-balance text-[clamp(2.1rem,1.4rem+2.6vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground"
        >
          {heroContent.headline}
        </motion.h1>

        <motion.p {...rise(0.85)} className="mt-5 max-w-[44ch] text-pretty text-[17px] leading-relaxed text-muted-foreground">
          {heroContent.lede}
        </motion.p>

        <motion.div {...rise(1.2, 28)} className="mt-10 w-full max-w-[420px]">
          <StartCard />
        </motion.div>
      </div>
    </section>
  );
}
