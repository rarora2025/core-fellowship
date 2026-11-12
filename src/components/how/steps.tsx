"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useSpring, useMotionValueEvent } from "framer-motion";

import { Reveal } from "@/components/how/reveal";
import { easeOutSoft } from "@/components/motion/easing";
import { howSteps } from "@/content/how-it-works";

/**
 * Three steps. On desktop, a sticky numeral on the left follows you down
 * the page while a thin line fills with your progress.
 */
export function Steps() {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 60%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.6 });
  const [active, setActive] = React.useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(howSteps.length - 1, Math.max(0, Math.floor(v * howSteps.length))));
  });

  return (
    <div ref={ref} className="relative grid gap-y-24 md:grid-cols-12 md:gap-x-8">
      {/* Sticky numeral + progress line (desktop) */}
      <div className="hidden md:col-span-4 md:block">
        <div className="sticky top-32 flex gap-6">
          <div className="relative h-56 w-px bg-border">
            <motion.div
              style={{ scaleY: reduce ? 1 : progress }}
              className="absolute inset-0 origin-top bg-brand-deep"
            />
          </div>
          <div className="relative h-40 w-56 overflow-hidden">
            {howSteps.map((s, i) => (
              <motion.span
                key={s.n}
                initial={false}
                animate={{
                  y: reduce ? 0 : `${(i - active) * 100}%`,
                  opacity: i === active ? 1 : 0,
                }}
                transition={{ duration: 0.9, ease: easeOutSoft }}
                className="absolute inset-0 text-[9rem] font-medium leading-none tracking-[-0.06em] text-foreground"
              >
                {s.n}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <ol className="space-y-28 md:col-span-7 md:col-start-6 md:space-y-48 md:py-8">
        {howSteps.map((s) => (
          <li key={s.n} className="md:min-h-[46vh]">
            <Reveal as="div" className="text-sm text-brand-deep md:hidden">
              {s.n}
            </Reveal>
            <Reveal as="h2" className="mt-2 text-[clamp(1.9rem,1.3rem+2vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-0">
              {s.title}
            </Reveal>
            <Reveal as="p" delay={0.15} className="mt-6 max-w-[52ch] text-[18px] leading-[1.65] text-muted-foreground">
              {s.body}
            </Reveal>
            <Reveal delay={0.3} className="mt-8 border-l-2 border-columbia pl-4 text-[15px] text-foreground">
              {s.aside}
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
