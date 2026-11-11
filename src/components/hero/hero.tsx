"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConnectionsVisual } from "@/components/hero/connections-visual";
import { easeOutSoft } from "@/components/motion/easing";
import { applyLinks, heroContent } from "@/content/site";

/**
 * Hero load-in is intentionally slow: words surface one at a time out of a
 * soft blur, then the supporting copy, then the visual. Total ~3s before
 * the connections start drawing.
 */
export function Hero() {
  const reduce = useReducedMotion();

  const word: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : { opacity: 0, y: "0.45em", filter: "blur(14px)" },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: reduce ? 0.4 : 1.35,
        ease: easeOutSoft,
        delay: reduce ? 0 : 0.5 + i * 0.075,
      },
    }),
  };

  const fadeUp = (delay: number, distance = 14) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: distance, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: reduce ? 0.4 : 1.2, ease: easeOutSoft, delay: reduce ? 0 : delay },
  });

  const leadWords = heroContent.headline.lead.split(" ");
  const accentWords = heroContent.headline.accent.split(" ");

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28"
    >
      <HeroBackdrop />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.p
            {...fadeUp(0.3, 8)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur sm:text-[13px]"
          >
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-columbia opacity-70 [animation-duration:2.4s]" />
              <span className="relative inline-flex size-1.5 rounded-full bg-columbia-deep" />
            </span>
            <span>
              <span className="hidden sm:inline">A program by the </span>
              {heroContent.eyebrowOrg}
            </span>
          </motion.p>

          <h1
            id="hero-heading"
            className="mt-7 text-display font-medium text-balance text-foreground"
          >
            <span className="sr-only">
              {heroContent.headline.lead} {heroContent.headline.accent}
            </span>
            <span aria-hidden="true">
              {leadWords.map((w, i) => (
                <motion.span
                  key={`l-${i}`}
                  custom={i}
                  variants={word}
                  initial="hidden"
                  animate="show"
                  className="inline-block will-change-[transform,filter,opacity]"
                >
                  {w}&nbsp;
                </motion.span>
              ))}
              {accentWords.map((w, i) => (
                <motion.span
                  key={`a-${i}`}
                  custom={leadWords.length + i}
                  variants={word}
                  initial="hidden"
                  animate="show"
                  className="inline-block font-serif text-[1.08em] font-normal italic tracking-[-0.02em] text-columbia-deep will-change-[transform,filter,opacity]"
                >
                  {w}
                  {i < accentWords.length - 1 ? " " : ""}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p
            {...fadeUp(1.45)}
            className="mt-7 max-w-2xl text-lede text-pretty text-muted-foreground"
          >
            {heroContent.lede}
          </motion.p>

          <motion.div
            {...fadeUp(1.7)}
            className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <Button asChild size="lg">
              <Link href={applyLinks.student.href}>
                {applyLinks.student.label}
                <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={applyLinks.startup.href}>{applyLinks.startup.label}</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduce ? 0.4 : 1.6, ease: easeOutSoft, delay: reduce ? 0 : 2.0 }}
          className="mt-14 sm:mt-20"
        >
          <ConnectionsVisual startDelay={reduce ? 0 : 2.3} />
        </motion.div>
      </div>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.4, ease: easeOutSoft }}
        className="absolute left-1/2 top-[-18rem] h-[42rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--columbia-soft),transparent)]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent)] opacity-60" />
    </div>
  );
}
