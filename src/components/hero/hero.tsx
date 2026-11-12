"use client";

import { motion, useReducedMotion } from "framer-motion";

import { StartCard } from "@/components/hero/start-card";
import { TypedPhrase } from "@/components/hero/typed-phrase";
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
      <div className="flex w-full max-w-[1100px] flex-col items-center text-center">
        <motion.p
          {...rise(0.15, 10)}
          className="mb-6 text-[15px] font-semibold tracking-[0.02em] text-foreground sm:text-base"
        >
          {heroContent.eyebrow}
        </motion.p>

        <motion.h1
          id="hero-heading"
          {...rise(0.3, 20)}
          className="text-[clamp(2.3rem,1.2rem+3.2vw,4.25rem)] font-medium leading-[1.06] tracking-[-0.035em] text-foreground"
        >
          <span className="sr-only">{heroContent.headlineA11y}</span>
          <span aria-hidden="true">
            <span className="block text-balance sm:whitespace-nowrap">{heroContent.headlineLead}</span>
            {/* The typing phrase keeps its own line, so nothing above or below moves. */}
            <span className="block min-h-[1.1em]">
              <TypedPhrase
                phrases={heroContent.headlinePhrases}
                startDelay={reduce ? 0 : 1.3}
                className="whitespace-nowrap text-brand-deep"
              />
            </span>
          </span>
        </motion.h1>

        <motion.div {...rise(0.8, 28)} className="mt-12 w-full max-w-[420px]">
          <StartCard />
        </motion.div>
      </div>
    </section>
  );
}
