"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";

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
}: {
  id: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const custom = value.filter((v) => !options.includes(v));
  const all = [...options, ...custom];

  function toggle(option: string) {
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
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      className="flex flex-wrap gap-2 outline-none"
    >
      {all.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(option)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] outline-none transition-[background-color,border-color,color] duration-300",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
              on
                ? "border-columbia-deep/40 bg-columbia-soft text-columbia-ink dark:border-brand-deep/50 dark:bg-brand/15 dark:text-foreground"
                : "border-input text-muted-foreground hover:border-columbia hover:text-foreground",
              invalid && !value.length && "border-destructive/50"
            )}
          >
            {on && <Check className="size-3.5" aria-hidden="true" />}
            {option}
          </button>
        );
      })}

      {allowCustom && (
        <span className="inline-flex h-9 items-center rounded-full border border-dashed border-input pl-3.5 pr-1 focus-within:border-columbia-deep/60">
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
            className="w-28 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-subtle-foreground"
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
