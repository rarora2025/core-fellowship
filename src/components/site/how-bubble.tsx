"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { easeOutSoft } from "@/components/motion/easing";
import { howIntro } from "@/content/how-it-works";

/**
 * A round "?" button pinned to the corner. Clicking it morphs the circle
 * into a card with the How it works story. Esc or a click outside closes it.
 */
export function HowBubble() {
  const [open, setOpen] = React.useState(false);
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-40 sm:bottom-8 sm:right-8">
      <motion.div
        layout
        transition={{ layout: spring }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ borderRadius: open ? 24 : 999 }}
        className={
          "origin-bottom-right overflow-hidden border border-border bg-white shadow-[0_1px_2px_rgba(11,13,18,0.06),0_24px_48px_-20px_rgba(15,44,74,0.28)] " +
          (open ? "w-[min(420px,calc(100vw-2.5rem))]" : "")
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="panel"
              role="dialog"
              aria-labelledby={titleId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5, ease: easeOutSoft, delay: reduce ? 0 : 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="p-6 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 id={titleId} className="text-[20px] font-medium tracking-[-0.02em]">
                  How it works
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  aria-label="Close"
                  className="-mr-2 -mt-1 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 space-y-4 text-[15px] leading-[1.65] text-muted-foreground">
                {howIntro.map((p, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: easeOutSoft, delay: reduce ? 0 : 0.25 + i * 0.1 }}
                  >
                    {p}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              ref={buttonRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label="How it works"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3, delay: reduce ? 0 : 0.1 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="grid size-14 place-items-center text-[22px] font-medium text-foreground transition-colors hover:bg-columbia-soft"
            >
              ?
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
