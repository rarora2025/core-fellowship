"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ringSizes, startups } from "@/content/orbit";

const SWAP_EVERY_MS = 2400;
const START_AFTER_MS = 3200;

/**
 * Two rings of logo circles slowly turning around the hero, in opposite
 * directions. Each circle counter-rotates so it stays upright. Every so often
 * one circle softly fades to a different startup.
 */
export function Orbit() {
  const reduce = useReducedMotion();
  const slotCount = ringSizes.inner + ringSizes.outer;

  // Which logo each slot shows, plus the one logo currently off screen.
  const [shown, setShown] = React.useState(() => startups.slice(0, slotCount).map((s) => s.logo));
  const spare = React.useRef(startups.slice(slotCount).map((s) => s.logo));

  React.useEffect(() => {
    if (reduce || spare.current.length === 0) return;
    let step = 0;
    // Visit slots alternating between rings so swaps feel spread out.
    const order = Array.from({ length: slotCount }, (_, i) =>
      i % 2 === 0 ? Math.floor(i / 2) : ringSizes.inner + Math.floor(i / 2)
    ).filter((v, i, a) => v < slotCount && a.indexOf(v) === i);
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        const slot = order[step % order.length];
        step += 1;
        setShown((prev) => {
          const next = [...prev];
          const incoming = spare.current.shift()!;
          spare.current.push(prev[slot]);
          next[slot] = incoming;
          return next;
        });
      }, SWAP_EVERY_MS);
    }, START_AFTER_MS);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [reduce, slotCount]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(circle_at_50%_50%,transparent_0,transparent_22%,black_42%)]"
    >
      <div className="absolute left-1/2 top-1/2 size-0">
        <Ring logos={shown.slice(0, ringSizes.inner)} radius="var(--r1)" duration={90} delay={1.0} />
        <Ring logos={shown.slice(ringSizes.inner)} radius="var(--r2)" duration={140} reverse delay={1.4} offset={22} />
      </div>
      <style>{`
        :root { --r1: 230px; --r2: 360px; --orb: 46px; }
        @media (min-width: 640px) { :root { --r1: 330px; --r2: 500px; --orb: 58px; } }
        @media (min-width: 1100px) { :root { --r1: 380px; --r2: 580px; --orb: 64px; } }
        @keyframes orbit-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .orbit-ring, .orbit-item { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function Ring({
  logos,
  radius,
  duration,
  reverse = false,
  delay,
  offset = 0,
}: {
  logos: string[];
  radius: string;
  duration: number;
  reverse?: boolean;
  delay: number;
  offset?: number;
}) {
  return (
    <div
      className="orbit-ring absolute left-0 top-0"
      style={{ animation: `orbit-spin ${duration}s linear infinite ${reverse ? "reverse" : "normal"}` }}
    >
      {logos.map((logo, i) => {
        const angle = offset + (360 / logos.length) * i;
        return (
          <div
            key={i}
            className="absolute left-0 top-0"
            style={{ transform: `rotate(${angle}deg) translateX(${radius}) rotate(${-angle}deg)` }}
          >
            <div
              className="orbit-item"
              style={{ animation: `orbit-spin ${duration}s linear infinite ${reverse ? "normal" : "reverse"}` }}
            >
              <LogoCoin logo={logo} delay={delay + i * 0.08} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const fitByLogo = new Map(startups.map((s) => [s.logo, s.fit ?? "cover"]));

/**
 * One circle. When its logo changes, the new one cross-fades in over the old.
 * Logos marked "contain" get padding so the round edge never crops them.
 */
function LogoCoin({ logo, delay }: { logo: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="-translate-x-1/2 -translate-y-1/2">
      <motion.div
        initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
        className="relative overflow-hidden rounded-full border border-border bg-white shadow-[0_8px_24px_-12px_rgb(var(--shadow-color)/0.25)]"
        style={{ width: "var(--orb)", height: "var(--orb)" }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={logo}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={"absolute inset-0 " + (fitByLogo.get(logo) === "contain" ? "p-[16%]" : "")}
          >
            <Image
              src={logo}
              alt=""
              width={128}
              height={128}
              className={"size-full " + (fitByLogo.get(logo) === "contain" ? "object-contain" : "rounded-full object-cover")}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
