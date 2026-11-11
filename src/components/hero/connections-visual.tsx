"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, HeartPulse, Leaf, Terminal, type LucideIcon } from "lucide-react";

import { easeInOutSoft, easeOutSoft } from "@/components/motion/easing";
import { cn } from "@/lib/utils";

/**
 * Illustrative only: these are example profiles and roles, not real
 * students or companies. Keep them generic (no names, no logos).
 */
type StudentProfile = { title: string; short: string; detail: string; tags: string[]; hue: string };
type StartupRole = { role: string; short: string; detail: string; icon: LucideIcon };

const students: StudentProfile[] = [
  { title: "Computer Science '27", short: "CS '27", detail: "Wants to build from day one", tags: ["Backend", "Systems"], hue: "from-[#cfe5f2] to-[#8fbfdf]" },
  { title: "Economics '26", short: "Econ '26", detail: "Curious about how startups grow", tags: ["Analytics", "Ops"], hue: "from-[#e7e4f6] to-[#b9b2e3]" },
  { title: "Biomedical Eng. '28", short: "BME '28", detail: "Into health and hardware", tags: ["Research", "Product"], hue: "from-[#dcf0e6] to-[#9fd0b6]" },
];

const startups: StartupRole[] = [
  { role: "Product Intern", short: "Product", detail: "Seed · Digital health", icon: HeartPulse },
  { role: "Founding Engineer", short: "Engineer", detail: "Seed · Climate software", icon: Leaf },
  { role: "Growth Associate", short: "Growth", detail: "Pre-seed · Dev tools", icon: Terminal },
];

/** Which student pairs with which role, cycled one at a time. */
const matches: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

const ROWS = [17, 50, 83]; // vertical centers, in % of the canvas

export function ConnectionsVisual({ startDelay = 0 }: { startDelay?: number }) {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState<number | null>(null);

  // Start cycling matches once the lines have finished drawing.
  React.useEffect(() => {
    const first = window.setTimeout(() => setActive(0), (startDelay + 2.6) * 1000);
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(
        () => setActive((a) => ((a ?? 0) + 1) % matches.length),
        reduce ? 6000 : 3800
      );
    }, (startDelay + 2.6) * 1000);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [startDelay, reduce]);

  const pair = active === null ? null : matches[active];

  return (
    <figure className="relative mx-auto w-full max-w-5xl">
      <figcaption className="sr-only">
        Illustration: example student profiles on the left connect through CORE
        to example startup roles on the right.
      </figcaption>

      <div
        aria-hidden="true"
        className="relative aspect-[4/5] w-full rounded-[28px] border border-border/80 bg-gradient-to-b from-white to-muted/60 p-3 shadow-[0_40px_80px_-40px_rgba(15,44,74,0.18)] sm:aspect-[16/8] sm:p-6"
      >
        <Lines pair={pair} startDelay={startDelay} reduce={!!reduce} />

        <div className="absolute inset-3 sm:inset-6">
          {students.map((s, i) => (
            <FloatingCard
              key={s.title}
              index={i}
              side="left"
              top={ROWS[i]}
              delay={startDelay + 0.15 * i}
              active={pair?.[0] === i}
              reduce={!!reduce}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className={cn("size-7 shrink-0 rounded-full bg-gradient-to-br sm:size-9", s.hue)} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.title}</span>
                  </p>
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">{s.detail}</p>
                </div>
              </div>
              <div className="mt-2.5 hidden gap-1.5 sm:flex">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </FloatingCard>
          ))}

          {startups.map((s, i) => {
            const Icon = s.icon;
            return (
              <FloatingCard
                key={s.role}
                index={i}
                side="right"
                top={ROWS[i]}
                delay={startDelay + 0.3 + 0.15 * i}
                active={pair?.[1] === i}
                reduce={!!reduce}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-foreground text-white sm:size-9 sm:rounded-xl">
                    <Icon className="size-3.5 sm:size-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground sm:text-sm">
                      <span className="sm:hidden">{s.short}</span>
                      <span className="hidden sm:inline">{s.role}</span>
                    </p>
                    <p className="hidden truncate text-xs text-muted-foreground sm:block">{s.detail}</p>
                  </div>
                </div>
                <div className="mt-2.5 hidden items-center justify-between sm:flex">
                  <span className="text-[11px] text-subtle-foreground">Early team</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    Open role
                  </span>
                </div>
              </FloatingCard>
            );
          })}

          <Hub delay={startDelay + 0.6} pairKey={active} reduce={!!reduce} />
        </div>
      </div>
    </figure>
  );
}

function FloatingCard({
  children,
  side,
  top,
  index,
  delay,
  active,
  reduce,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  top: number;
  index: number;
  delay: number;
  active: boolean;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: side === "left" ? -24 : 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: reduce ? 0.4 : 1.3, ease: easeOutSoft, delay }}
      style={{ top: `${top}%` }}
      className={cn(
        "absolute w-[36%] -translate-y-1/2 sm:w-[30%]",
        side === "left" ? "left-0" : "right-0"
      )}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, index % 2 ? 4 : -4, 0] }}
        transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut", delay: delay + 1 }}
        className={cn(
          "rounded-xl border bg-white/95 p-2.5 shadow-[0_1px_2px_rgba(11,13,18,0.04),0_12px_32px_-16px_rgba(11,13,18,0.18)] backdrop-blur transition-[border-color,box-shadow,transform] duration-700 ease-out-soft sm:rounded-2xl sm:p-4",
          active
            ? "border-columbia shadow-[0_0_0_4px_var(--columbia-soft),0_18px_40px_-18px_rgba(42,93,143,0.35)]"
            : "border-border"
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Hub({ delay, pairKey, reduce }: { delay: number; pairKey: number | null; reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0.4 : 1.2, ease: easeOutSoft, delay }}
      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
    >
      <div className="relative">
        {!reduce && (
          <motion.span
            className="absolute inset-0 rounded-2xl bg-columbia"
            animate={{ scale: [1, 1.5], opacity: [0.35, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: delay + 1.5 }}
          />
        )}
        <div className="relative grid size-12 place-items-center rounded-2xl bg-foreground text-[11px] font-semibold tracking-[0.08em] text-white shadow-[0_16px_32px_-12px_rgba(11,13,18,0.5)] sm:size-16 sm:text-xs">
          CORE
        </div>
      </div>
      <div className="mt-3 h-6">
        <AnimatePresence mode="wait">
          {pairKey !== null && (
            <motion.span
              key={pairKey}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.6, ease: easeOutSoft }}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-columbia/70 bg-columbia-soft px-2.5 py-1 text-[10px] font-medium text-columbia-ink sm:text-[11px]"
            >
              <Check className="size-3" strokeWidth={2.25} />
              Intro made
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Lines are drawn in real pixel coordinates (measured with a ResizeObserver)
 * so strokes, dashes, and pathLength animations stay crisp at any size.
 */
function Lines({
  pair,
  startDelay,
  reduce,
}: {
  pair: [number, number] | null;
  startDelay: number;
  reduce: boolean;
}) {
  const ref = React.useRef<SVGSVGElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  // Card width as a share of the canvas; must match FloatingCard's w-[36%] / sm:w-[30%].
  const cardW = (w >= 560 ? 0.3 : 0.36) * w;
  const cx = w / 2;
  const cy = h / 2;
  const ys = ROWS.map((r) => (r / 100) * h);
  const bend = Math.max(24, (cx - cardW) * 0.55);

  const left = (y: number) =>
    `M ${cardW} ${y} C ${cardW + bend} ${y}, ${cx - bend} ${cy}, ${cx} ${cy}`;
  const right = (y: number) =>
    `M ${cx} ${cy} C ${cx + bend} ${cy}, ${w - cardW - bend} ${y}, ${w - cardW} ${y}`;
  const full = (a: number, b: number) =>
    `${left(ys[a])} C ${cx + bend} ${cy}, ${w - cardW - bend} ${ys[b]}, ${w - cardW} ${ys[b]}`;

  const base = { fill: "none", strokeLinecap: "round" as const };

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${w || 1} ${h || 1}`}
      className="pointer-events-none absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] overflow-visible sm:inset-6 sm:h-[calc(100%-3rem)] sm:w-[calc(100%-3rem)]"
    >
      {w > 0 &&
        ys.map((y, i) => (
          <React.Fragment key={i}>
            {[left(y), right(y)].map((d, side) => (
              <motion.path
                key={side}
                d={d}
                {...base}
                stroke="#d3dae2"
                strokeWidth={1.25}
                initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: reduce ? 0.4 : 1.6,
                  ease: easeInOutSoft,
                  delay: reduce ? 0 : startDelay + 0.9 + side * 0.25 + i * 0.12,
                }}
              />
            ))}
          </React.Fragment>
        ))}

      <AnimatePresence>
        {w > 0 && pair && (
          <motion.g
            key={`${pair[0]}-${pair[1]}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: easeOutSoft }}
          >
            <motion.path
              d={full(pair[0], pair[1])}
              {...base}
              stroke="var(--columbia)"
              strokeWidth={2}
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: easeInOutSoft }}
            />
            {!reduce && (
              // A small bead of light that travels the matched path once.
              <motion.path
                d={full(pair[0], pair[1])}
                {...base}
                pathLength={1}
                stroke="var(--columbia-deep)"
                strokeWidth={2.5}
                strokeDasharray="0.05 2"
                initial={{ strokeDashoffset: 0.05, opacity: 1 }}
                animate={{ strokeDashoffset: -1, opacity: [1, 1, 0] }}
                transition={{ duration: 1.8, ease: easeInOutSoft, delay: 0.5 }}
              />
            )}
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
