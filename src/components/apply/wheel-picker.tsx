"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

const ITEM = 52; // px per row
const VISIBLE = 5; // rows in view, odd so one sits in the middle

/**
 * A scrolling wheel, like the iOS date picker. Scroll, drag, tap a row,
 * or use the arrow keys. Whatever lands in the middle is the value.
 */
export function WheelPicker({
  id,
  options,
  value,
  onChange,
  labelledBy,
  describedBy,
  defaultIndex = 0,
}: {
  id: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labelledBy?: string;
  describedBy?: string;
  defaultIndex?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const { scrollY } = useScroll({ container: ref });
  const settleTimer = React.useRef<number | undefined>(undefined);
  const initialIndex = Math.max(0, value ? options.indexOf(value) : defaultIndex);
  const [active, setActive] = React.useState(initialIndex);

  // Start centered on the current (or default) value, without animating.
  React.useLayoutEffect(() => {
    ref.current?.scrollTo({ top: initialIndex * ITEM });
    if (!value) onChange(options[initialIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  function scrollToIndex(i: number) {
    const clamped = Math.min(Math.max(i, 0), options.length - 1);
    ref.current?.scrollTo({ top: clamped * ITEM, behavior: reduce ? "auto" : "smooth" });
  }

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const i = Math.min(Math.max(Math.round(el.scrollTop / ITEM), 0), options.length - 1);
    if (i !== active) setActive(i);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (options[i] !== value) onChange(options[i]);
    }, 90);
  }

  return (
    <div className="relative mx-auto w-full max-w-[280px]" style={{ height: ITEM * VISIBLE }}>
      {/* Selection band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 rounded-xl bg-columbia-soft ring-1 ring-columbia/50 dark:ring-brand/25"
        style={{ top: ITEM * Math.floor(VISIBLE / 2), height: ITEM }}
      />
      <div
        ref={ref}
        id={id}
        role="listbox"
        tabIndex={0}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-activedescendant={`${id}-opt-${active}`}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            scrollToIndex(active + (e.key === "ArrowDown" ? 1 : -1));
          }
        }}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
        style={{
          paddingBlock: ITEM * Math.floor(VISIBLE / 2),
          perspective: 600,
          maskImage: "linear-gradient(to bottom, transparent, #000 32%, #000 68%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 32%, #000 68%, transparent)",
        }}
      >
        {options.map((option, i) => (
          <WheelRow
            key={option}
            id={`${id}-opt-${i}`}
            index={i}
            label={option}
            selected={i === active}
            scrollY={scrollY}
            reduce={reduce}
            onSelect={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

function WheelRow({
  id,
  index,
  label,
  selected,
  scrollY,
  reduce,
  onSelect,
}: {
  id: string;
  index: number;
  label: string;
  selected: boolean;
  scrollY: MotionValue<number>;
  reduce: boolean;
  onSelect: () => void;
}) {
  const range = [(index - 2) * ITEM, index * ITEM, (index + 2) * ITEM];
  const rotateX = useTransform(scrollY, range, reduce ? [0, 0, 0] : [48, 0, -48]);
  const opacity = useTransform(scrollY, range, [0.25, 1, 0.25]);
  const scale = useTransform(scrollY, range, reduce ? [1, 1, 1] : [0.86, 1, 0.86]);

  return (
    <motion.div
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      style={{ height: ITEM, rotateX, opacity, scale }}
      className={cn(
        "flex cursor-pointer snap-center items-center justify-center font-display text-[22px] font-bold tracking-[-0.02em] tabular-nums transition-colors duration-200 select-none",
        selected ? "text-columbia-ink dark:text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
    </motion.div>
  );
}
