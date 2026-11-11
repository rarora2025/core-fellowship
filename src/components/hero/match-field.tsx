"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { easeInOutSoft, easeOutSoft } from "@/components/motion/easing";
import { cn } from "@/lib/utils";

/**
 * A typographic diagram: example students along the top, example startup
 * roles along the bottom, joined by fine lines. One match at a time is
 * traced in Columbia blue.
 *
 * Illustrative only. These are not real students or companies, so keep
 * them generic: no names, no logos.
 */
const students = [
  { label: "Computer Science \u201927", short: "CS \u201927", meta: "Backend, systems", shortMeta: "Backend" },
  { label: "Economics \u201926", short: "Econ \u201926", meta: "Analytics, ops", shortMeta: "Ops" },
  { label: "Biomedical Eng. \u201928", short: "BME \u201928", meta: "Research", shortMeta: "Research" },
  { label: "Applied Math \u201928", short: "Math \u201928", meta: "ML, data", shortMeta: "ML" },
  { label: "Political Science \u201927", short: "PoliSci \u201927", meta: "Policy, growth", shortMeta: "Growth" },
  { label: "Film \u201926", short: "Film \u201926", meta: "Brand, content", shortMeta: "Brand" },
];

const roles = [
  { label: "Operations lead", short: "Ops lead", meta: "Marketplace", shortMeta: "Marketplace" },
  { label: "Product intern", short: "Product", meta: "Digital health", shortMeta: "Health" },
  { label: "Founding engineer", short: "Founding eng.", meta: "Climate software", shortMeta: "Climate" },
  { label: "Growth associate", short: "Growth", meta: "Developer tools", shortMeta: "Dev tools" },
  { label: "Brand and content", short: "Brand", meta: "Consumer", shortMeta: "Consumer" },
  { label: "ML engineer", short: "ML eng.", meta: "Fintech", shortMeta: "Fintech" },
];

/** Background web of possible fits: [studentIndex, roleIndex]. */
const edges: [number, number][] = [
  [0, 2], [0, 5], [1, 0], [1, 3], [2, 1], [2, 2],
  [3, 5], [3, 0], [4, 3], [4, 4], [5, 4], [5, 3],
];

/**
 * The matches that get traced, in order. Each must exist in `edges`.
 * The first three stay within the first three columns so mobile has matches too.
 */
const matches: [number, number][] = [
  [0, 2], [1, 0], [2, 1], [3, 5], [4, 3], [5, 4],
];

const NODE_INSET = 92; // px from top/bottom edge to the node row

export function MatchField({ startDelay = 0 }: { startDelay?: number }) {
  const reduce = !!useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [active, setActive] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    let interval: number | undefined;
    const begin = window.setTimeout(() => {
      setActive(0);
      interval = window.setInterval(() => setActive((a) => ((a ?? 0) + 1) % matches.length), 3600);
    }, (startDelay + 3.2) * 1000);
    return () => {
      window.clearTimeout(begin);
      if (interval) window.clearInterval(interval);
    };
  }, [startDelay]);

  // Fewer columns on small screens.
  const n = size.w === 0 ? 6 : size.w < 640 ? 3 : size.w < 1000 ? 4 : 6;
  const colW = size.w / n;
  const compact = size.w > 0 && size.w < 640;
  const x = (i: number) => i * colW + Math.min(20, colW * 0.08);
  const yTop = NODE_INSET;
  const yBot = size.h - NODE_INSET;

  const visibleEdges = edges.filter(([s, r]) => s < n && r < n);
  const visibleMatches = matches.filter(([s, r]) => s < n && r < n);
  const current = active === null ? null : visibleMatches[active % visibleMatches.length];

  const path = ([s, r]: [number, number]) => {
    const x1 = x(s);
    const x2 = x(r);
    const mid = (yTop + yBot) / 2;
    return `M ${x1} ${yTop} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${yBot}`;
  };

  return (
    <figure className="relative">
      <figcaption className="sr-only">
        Illustration: example Columbia students along the top connect to example startup roles
        along the bottom, with one match highlighted at a time.
      </figcaption>

      <div aria-hidden="true" className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div ref={ref} className="relative h-[380px] sm:h-[420px]">
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
          >
            {size.w > 0 &&
              visibleEdges.map((e, i) => (
                <motion.path
                  key={`${e[0]}-${e[1]}-${n}`}
                  d={path(e)}
                  fill="none"
                  className="stroke-[#dde2e8]"
                  strokeWidth={1}
                  initial={{ pathLength: reduce ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: reduce ? 0 : 2.2,
                    ease: easeInOutSoft,
                    delay: reduce ? 0 : startDelay + 0.8 + i * 0.09,
                  }}
                />
              ))}

            {size.w > 0 && current && (
              <motion.path
                key={`active-${current[0]}-${current[1]}-${n}`}
                d={path(current)}
                fill="none"
                className="stroke-columbia-deep"
                strokeWidth={1.75}
                initial={{ pathLength: reduce ? 1 : 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reduce ? 0 : 1.6, ease: easeInOutSoft }}
              />
            )}

            {size.w > 0 &&
              Array.from({ length: n }).map((_, i) => (
                <React.Fragment key={i}>
                  <Node cx={x(i)} cy={yTop} on={current?.[0] === i} delay={startDelay + 0.2 + i * 0.08} reduce={reduce} />
                  <Node cx={x(i)} cy={yBot} on={current?.[1] === i} delay={startDelay + 0.5 + i * 0.08} reduce={reduce} />
                </React.Fragment>
              ))}
          </svg>

          {/* Labels */}
          {students.slice(0, n).map((s, i) => (
            <Label
              key={s.label}
              left={x(i)}
              width={colW}
              position="top"
              on={current?.[0] === i}
              delay={startDelay + i * 0.08}
              reduce={reduce}
              label={compact ? s.short : s.label}
              meta={compact ? s.shortMeta : s.meta}
            />
          ))}
          {roles.slice(0, n).map((r, i) => (
            <Label
              key={r.label}
              left={x(i)}
              width={colW}
              position="bottom"
              on={current?.[1] === i}
              delay={startDelay + 0.3 + i * 0.08}
              reduce={reduce}
              label={compact ? r.short : r.label}
              meta={compact ? r.shortMeta : r.meta}
            />
          ))}
        </div>
      </div>
    </figure>
  );
}

function Node({
  cx,
  cy,
  on,
  delay,
  reduce,
}: {
  cx: number;
  cy: number;
  on: boolean;
  delay: number;
  reduce: boolean;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      initial={{ r: 0 }}
      animate={{ r: on ? 4.5 : 3 }}
      transition={{ duration: reduce ? 0.2 : 0.9, ease: easeOutSoft, delay: on ? 0 : reduce ? 0 : delay }}
      className={cn(
        "transition-[fill,stroke] duration-700",
        on ? "fill-columbia-deep stroke-columbia-soft" : "fill-white stroke-foreground/40"
      )}
      strokeWidth={on ? 4 : 1}
    />
  );
}

function Label({
  left,
  width,
  position,
  on,
  delay,
  reduce,
  label,
  meta,
}: {
  left: number;
  width: number;
  position: "top" | "bottom";
  on: boolean;
  delay: number;
  reduce: boolean;
  label: string;
  meta: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : position === "top" ? -8 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.3 : 1.2, ease: easeOutSoft, delay: reduce ? 0 : delay }}
      style={{ left, width: Math.max(0, width - 16) }}
      className={cn("absolute", position === "top" ? "top-6" : "bottom-6")}
    >
      <p
        className={cn(
          "truncate font-serif text-[15px] leading-tight transition-colors duration-700 sm:text-lg",
          on ? "text-foreground" : "text-foreground/55"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-[10px] uppercase tracking-[0.14em] transition-colors duration-700 sm:text-[11px]",
          on ? "text-columbia-deep" : "text-subtle-foreground"
        )}
      >
        {meta}
      </p>
    </motion.div>
  );
}
