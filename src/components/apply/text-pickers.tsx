"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search } from "lucide-react";

import { easeOutSoft } from "@/components/motion/easing";
import { majorOptions } from "@/content/student-application";
import { cn } from "@/lib/utils";

const fieldShell =
  "flex h-12 w-full items-center rounded-xl border border-input bg-background transition-[border-color,box-shadow] duration-300 focus-within:border-columbia-deep/60 focus-within:ring-4 focus-within:ring-columbia-soft has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-4 has-[[aria-invalid=true]]:ring-destructive/10";

/** Search box with tappable suggestions. Anything typed still counts. */
export function MajorPicker({
  value,
  onChange,
  describedBy,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  describedBy?: string;
  invalid?: boolean;
}) {
  const q = value.trim().toLowerCase();
  const exact = majorOptions.find((m) => m.toLowerCase() === q);
  const matches = q
    ? majorOptions.filter((m) => m.toLowerCase().includes(q)).slice(0, 8)
    : majorOptions.slice(0, 8);

  return (
    <div>
      <div className={fieldShell}>
        <Search className="ml-4 size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
        <input
          id="answer"
          autoFocus
          autoComplete="off"
          aria-labelledby="question"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          placeholder="Computer Science"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-subtle-foreground sm:text-[15px]"
        />
      </div>
      <motion.ul layout className="mt-3 flex flex-wrap gap-2" aria-label="Suggestions">
        <AnimatePresence mode="popLayout" initial={false}>
          {matches.map((m) => {
            const on = exact === m;
            return (
              <motion.li
                key={m}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, ease: easeOutSoft }}
              >
                <button
                  type="button"
                  onClick={() => onChange(m)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14px] outline-none transition-[background-color,border-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:px-3.5 sm:text-[13.5px]",
                    on
                      ? "border-cta/60 bg-columbia-soft text-foreground"
                      : "border-input text-muted-foreground hover:border-columbia hover:text-foreground"
                  )}
                >
                  {on && <Check className="size-3.5 text-cta" aria-hidden="true" />}
                  {m}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

function handleFrom(value: string) {
  const m = value.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  return m ? decodeURIComponent(m[1]) : value.replace(/^@/, "");
}

/** LinkedIn with the URL prefix built in, so people only type their handle. */
export function LinkedInInput({
  value,
  onChange,
  describedBy,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  describedBy?: string;
  invalid?: boolean;
}) {
  const handle = value ? handleFrom(value) : "";
  return (
    <div className={fieldShell}>
      <span className="select-none pl-4 text-base text-subtle-foreground sm:text-[15px]" aria-hidden="true">
        linkedin.com/in/
      </span>
      <input
        id="answer"
        autoFocus
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-labelledby="question"
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        placeholder="yourname"
        value={handle}
        onChange={(e) => {
          const h = handleFrom(e.target.value.trim());
          onChange(h ? `https://www.linkedin.com/in/${h}` : "");
        }}
        className="h-full min-w-0 flex-1 bg-transparent pr-4 text-base text-foreground outline-none placeholder:text-subtle-foreground sm:text-[15px]"
      />
    </div>
  );
}
