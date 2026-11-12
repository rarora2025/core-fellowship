"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { innerRing, outerRing, type OrbitItem } from "@/content/orbit";

/**
 * Two rings of circles slowly turning around the hero, in opposite
 * directions. Each circle counter-rotates so its contents stay upright.
 * Sits behind the content and fades toward the middle.
 */
export function Orbit() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(circle_at_50%_50%,transparent_0,transparent_22%,black_42%)]"
    >
      <div className="absolute left-1/2 top-1/2 size-0">
        <Ring items={innerRing} radius="var(--r1)" duration={90} delay={1.0} />
        <Ring items={outerRing} radius="var(--r2)" duration={140} reverse delay={1.4} />
      </div>
      <style>{`
        :root { --r1: 230px; --r2: 360px; --orb: 46px; }
        @media (min-width: 640px) { :root { --r1: 330px; --r2: 500px; --orb: 58px; } }
        @media (min-width: 1100px) { :root { --r1: 380px; --r2: 580px; --orb: 64px; } }
        @keyframes orbit-spin { to { transform: rotate(360deg); } }
        @keyframes orbit-unspin { to { transform: rotate(-360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .orbit-ring, .orbit-item { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function Ring({
  items,
  radius,
  duration,
  reverse = false,
  delay,
}: {
  items: OrbitItem[];
  radius: string;
  duration: number;
  reverse?: boolean;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const dir = reverse ? "reverse" : "normal";
  return (
    <div
      className="orbit-ring absolute left-0 top-0"
      style={{ animation: `orbit-spin ${duration}s linear infinite ${dir}` }}
    >
      {items.map((item, i) => {
        const angle = (360 / items.length) * i;
        return (
          <div
            key={item.label}
            className="absolute left-0 top-0"
            style={{ transform: `rotate(${angle}deg) translateX(${radius}) rotate(${-angle}deg)` }}
          >
            <div
              className="orbit-item"
              style={{ animation: `orbit-spin ${duration}s linear infinite ${reverse ? "normal" : "reverse"}` }}
            >
              <motion.div
                initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay + i * 0.06 }}
                className="grid -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border border-border bg-white shadow-[0_8px_24px_-12px_rgb(var(--shadow-color)/0.25)]"
                style={{ width: "var(--orb)", height: "var(--orb)" }}
                title={item.label}
              >
                <Image src={item.logo} alt="" width={128} height={128} className="size-full object-cover" />
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
