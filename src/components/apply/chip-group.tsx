"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";

import { easeOutSoft } from "@/components/motion/easing";

import { cn } from "@/lib/utils";

/**
 * Multi-select as a row of toggle chips. Optionally lets people
 * add their own entry, which then shows up as a selected chip.
 */
export function ChipGroup({
  id,
  options,
  value,
  onChange,
  allowCustom,
  customPlaceholder = "Add your own",
  invalid,
  describedBy,
  single,
  labelledBy,
}: {
  id: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Pick exactly one instead of many. */
  single?: boolean;
  labelledBy?: string;
}) {
  const reduce = !!useReducedMotion();
  const [draft, setDraft] = React.useState("");
  const custom = value.filter((v) => !options.includes(v));
  const all = [...options, ...custom];

  function toggle(option: string) {
    if (single) return onChange([option]);
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  function addDraft() {
    const v = draft.trim();
    if (!v) return;
    const existing = all.find((o) => o.toLowerCase() === v.toLowerCase());
    if (existing) {
      if (!value.includes(existing)) onChange([...value, existing]);
    } else {
      onChange([...value, v]);
    }
    setDraft("");
  }

  return (
    <div
      id={id}
      role="group"
      tabIndex={-1}
      aria-labelledby={labelledBy ?? `${id}-label`}
      aria-describedby={describedBy}
      className="flex flex-wrap justify-center gap-2 outline-none"
    >
      {all.map((option, i) => {
        const on = value.includes(option);
        return (
          <motion.button
            key={option}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutSoft, delay: 0.25 + i * 0.035 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(option)}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14px] sm:h-9 sm:px-3.5 sm:text-[13.5px] outline-none transition-[background-color,border-color,color] duration-300",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
              on
                ? "border-columbia-deep/40 bg-columbia-soft text-columbia-ink dark:border-brand-deep/50 dark:bg-brand/15 dark:text-foreground"
                : "border-input text-muted-foreground hover:border-columbia hover:text-foreground",
              invalid && !value.length && "border-destructive/50"
            )}
          >
            {on && <Check className="size-3.5" aria-hidden="true" />}
            {option}
          </motion.button>
        );
      })}

      {allowCustom && (
        <span className="inline-flex h-10 items-center rounded-full border border-dashed sm:h-9 border-input pl-3.5 pr-1 focus-within:border-columbia-deep/60">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder={customPlaceholder}
            aria-label={customPlaceholder}
            maxLength={40}
            className="w-28 bg-transparent text-base sm:text-[13.5px] text-foreground outline-none placeholder:text-subtle-foreground"
          />
          <button
            type="button"
            onClick={addDraft}
            aria-label="Add"
            className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </span>
      )}
    </div>
  );
}
