"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useAnimate, useReducedMotion } from "framer-motion";

import { ringSizes, startups } from "@/content/orbit";

const FLIP_EVERY_MS = 1700;
const START_AFTER_MS = 3200;

/**
 * Two rings of logo circles slowly turning around the hero, in opposite
 * directions. Each circle counter-rotates so it stays upright. Every so often
 * one circle flips over and comes back showing a different startup.
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
    // Visit slots alternating between rings so flips feel spread out.
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
      }, FLIP_EVERY_MS);
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

/**
 * One circle. When its logo changes it turns edge-on, swaps the image while
 * invisible, and turns back. The whole circle rotates (border and all), so it
 * stays perfectly round through the flip.
 */
function LogoCoin({ logo, delay }: { logo: string; delay: number }) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate();
  const [current, setCurrent] = React.useState(logo);

  React.useEffect(() => {
    if (logo === current) return;
    let cancelled = false;
    (async () => {
      await animate(scope.current, { rotateY: 90 }, { duration: 0.32, ease: [0.55, 0, 1, 0.45] });
      if (cancelled) return;
      setCurrent(logo);
      await animate(scope.current, { rotateY: [-90, 0] }, { duration: 0.42, ease: [0, 0.55, 0.45, 1] });
    })();
    return () => {
      cancelled = true;
    };
  }, [logo, current, animate, scope]);

  return (
    <div className="-translate-x-1/2 -translate-y-1/2 [perspective:500px]">
      <motion.div
        initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
      >
        <div
          ref={scope}
          className="overflow-hidden rounded-full border border-border bg-white shadow-[0_8px_24px_-12px_rgb(var(--shadow-color)/0.25)] [backface-visibility:hidden]"
          style={{ width: "var(--orb)", height: "var(--orb)" }}
        >
          <Image src={current} alt="" width={128} height={128} className="size-full rounded-full object-cover" />
        </div>
      </motion.div>
    </div>
  );
}
