"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";

const TYPE_MS = 75;
const DELETE_MS = 38;
const HOLD_MS = 2000;
const GAP_MS = 350;

/**
 * Types each phrase, holds it, deletes it, and moves to the next.
 * With reduced motion it simply swaps phrases.
 */
export function TypedPhrase({
  phrases,
  startDelay = 0,
  className,
}: {
  phrases: readonly string[];
  startDelay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [text, setText] = React.useState("");
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setStarted(true), startDelay * 1000);
    return () => window.clearTimeout(t);
  }, [startDelay]);

  React.useEffect(() => {
    if (!started) return;
    const full = phrases[index];

    if (reduce) {
      setText(full);
      const t = window.setTimeout(() => setIndex((i) => (i + 1) % phrases.length), HOLD_MS + 1200);
      return () => window.clearTimeout(t);
    }

    let timer: number;
    let deleting = false;
    let current = "";

    const tick = () => {
      if (!deleting) {
        current = full.slice(0, current.length + 1);
        setText(current);
        if (current === full) {
          deleting = true;
          timer = window.setTimeout(tick, HOLD_MS);
          return;
        }
        timer = window.setTimeout(tick, TYPE_MS + Math.random() * 40);
      } else {
        current = current.slice(0, -1);
        setText(current);
        if (current === "") {
          timer = window.setTimeout(() => setIndex((i) => (i + 1) % phrases.length), GAP_MS);
          return;
        }
        timer = window.setTimeout(tick, DELETE_MS);
      }
    };
    timer = window.setTimeout(tick, GAP_MS);
    return () => window.clearTimeout(timer);
  }, [started, index, phrases, reduce]);

  return (
    <span className={className}>
      {text}
      <span
        aria-hidden="true"
        className="ml-[0.06em] inline-block h-[0.9em] w-[0.06em] translate-y-[0.1em] animate-[caret_1.1s_steps(1)_infinite] bg-current"
      />
    </span>
  );
}
