"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { MatchField } from "@/components/hero/match-field";
import { easeOutSoft } from "@/components/motion/easing";
import { applyLinks, heroContent } from "@/content/site";

/**
 * Load-in, slowest to fastest:
 *  1. hairline rules draw across
 *  2. headline rises word by word from behind a mask (no blur)
 *  3. lede and apply rows settle in
 *  4. the match field draws itself below
 */
export function Hero() {
  const reduce = !!useReducedMotion();
  const words = heroContent.headline.split(" ");

  const t = (delay: number, duration = 1.2) => ({
    duration: reduce ? 0.3 : duration,
    ease: easeOutSoft,
    delay: reduce ? 0 : delay,
  });

  return (
    <section aria-labelledby="hero-heading" className="relative pt-24 sm:pt-28">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Kicker row */}
        <div className="relative flex items-center justify-between gap-6 py-4 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.6)}>
            {heroContent.kicker}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={t(0.75)}
            className="hidden text-right md:block"
          >
            {heroContent.kickerRight}
          </motion.span>
          <Rule className="bottom-0" delay={0.2} reduce={reduce} />
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="mt-10 max-w-[17ch] font-serif text-display font-light text-foreground sm:mt-14 [font-variation-settings:'opsz'_72]"
        >
          <span className="sr-only">{heroContent.headline}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block will-change-transform"
                  initial={reduce ? { opacity: 0 } : { y: "105%" }}
                  animate={reduce ? { opacity: 1 } : { y: "0%" }}
                  transition={t(0.7 + i * 0.07, 1.5)}
                >
                  {w}
                  {i < words.length - 1 ? " " : ""}
                </motion.span>
              </span>
            ))}
          </span>
        </h1>

        {/* Lede + apply rows */}
        <div className="mt-12 grid gap-10 pb-14 sm:mt-16 md:grid-cols-12 md:gap-8 md:pb-20">
          <motion.p
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(1.9, 1.3)}
            className="max-w-[38ch] text-lede text-muted-foreground md:col-span-5"
          >
            {heroContent.lede}
          </motion.p>

          <motion.nav
            aria-label="Apply"
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(2.1, 1.3)}
            className="md:col-span-6 md:col-start-7"
          >
            <ApplyRow href={applyLinks.student.href} label={applyLinks.student.label} note="Students" primary />
            <ApplyRow href={applyLinks.startup.href} label={applyLinks.startup.label} note="Founders" />
          </motion.nav>
        </div>
      </div>

      <div className="relative">
        <Rule className="top-0" delay={2.3} reduce={reduce} />
        <MatchField startDelay={reduce ? 0 : 2.6} />
      </div>
    </section>
  );
}

function ApplyRow({
  href,
  label,
  note,
  primary = false,
}: {
  href: string;
  label: string;
  note: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center justify-between gap-4 border-t border-foreground/15 py-5 last:border-b sm:py-6"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-left scale-x-0 bg-columbia-soft transition-transform duration-700 ease-out-soft group-hover:scale-x-100"
      />
      <span className="relative flex items-baseline gap-4 sm:gap-6">
        <span className="hidden w-20 text-[11px] uppercase tracking-[0.14em] text-subtle-foreground sm:inline">
          {note}
        </span>
        <span className="text-xl tracking-[-0.01em] text-foreground sm:text-2xl">{label}</span>
      </span>
      <span
        className={
          "relative grid size-10 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-500 ease-out-soft group-hover:translate-x-1 sm:size-11 " +
          (primary ? "bg-foreground text-background" : "border border-foreground/20 text-foreground")
        }
      >
        <ArrowRight className="size-4" strokeWidth={1.75} />
      </span>
    </Link>
  );
}

function Rule({ className, delay, reduce }: { className?: string; delay: number; reduce: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scaleX: reduce ? 1 : 0, opacity: reduce ? 0 : 1 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: reduce ? 0.3 : 1.8, ease: easeOutSoft, delay: reduce ? 0 : delay }}
      className={"absolute inset-x-0 h-px origin-left bg-foreground/15 " + (className ?? "")}
    />
  );
}
