"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";

import { interestIcons, roleIcons } from "@/components/apply/icon-tiles";
import { easeOutSoft } from "@/components/motion/easing";
import { interestOptions, roleOptions, skillSuggestions } from "@/content/student-application";
import type { StudentApplication, StudentField } from "@/lib/applications/student";
import { cn } from "@/lib/utils";

type Key = "skills" | "interests" | "roles";

const tabs: { key: Key; label: string; options: string[]; custom?: boolean }[] = [
  { key: "skills", label: "Good at", options: skillSuggestions, custom: true },
  { key: "interests", label: "Spaces", options: interestOptions },
  { key: "roles", label: "Roles", options: roleOptions },
];

/**
 * Skills, spaces and roles on one screen. Three tabs with a running
 * count, and a soft hand-off to the next tab once one is filled.
 */
export function FuturePicker({
  skills,
  interests,
  roles,
  onChange,
  describedBy,
  focusField,
}: {
  skills: string[];
  interests: string[];
  roles: string[];
  onChange: <K extends StudentField>(key: K, value: StudentApplication[K]) => void;
  describedBy?: string;
  focusField?: StudentField | null;
}) {
  const reduce = !!useReducedMotion();
  const values: Record<Key, string[]> = { skills, interests, roles };
  const [tab, setTab] = React.useState<Key>("skills");
  const [draft, setDraft] = React.useState("");
  const id = React.useId();

  React.useEffect(() => {
    if (focusField === "skills" || focusField === "interests" || focusField === "roles") setTab(focusField);
  }, [focusField]);

  const active = tabs.find((t) => t.key === tab)!;
  const value = values[tab];
  const options = [...active.options, ...value.filter((v) => !active.options.includes(v))];

  function toggle(option: string) {
    onChange(tab, value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  function addDraft() {
    const v = draft.trim();
    if (!v) return;
    const existing = options.find((o) => o.toLowerCase() === v.toLowerCase());
    const pick = existing ?? v;
    if (!value.includes(pick)) onChange(tab, [...value, pick]);
    setDraft("");
  }

  const icons = tab === "interests" ? interestIcons : tab === "roles" ? roleIcons : null;

  return (
    <div>
      <div role="tablist" aria-label="Sections" className="relative grid grid-cols-3 rounded-2xl bg-muted p-1">
        {tabs.map((t) => {
          const selected = t.key === tab;
          const count = values[t.key].length;
          return (
            <button
              key={t.key}
              id={t.key === "skills" ? "answer" : undefined}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative z-10 flex h-10 items-center justify-center gap-1.5 rounded-xl text-[14px] outline-none transition-colors duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${id}-pill`}
                  transition={{ duration: 0.45, ease: easeOutSoft }}
                  className="absolute inset-0 -z-10 rounded-xl bg-card shadow-[0_1px_2px_rgb(var(--shadow-color)/0.12)] dark:bg-secondary"
                />
              )}
              {t.label}
              <AnimatePresence initial={false}>
                {count > 0 && (
                  <motion.span
                    key="n"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: easeOutSoft }}
                    className="grid h-5 min-w-5 place-items-center rounded-full bg-cta px-1.5 text-[11px] font-semibold tabular-nums text-cta-foreground"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      <div id={`${id}-panel`} role="tabpanel" aria-describedby={describedBy} className="mt-3 min-h-[188px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: reduce ? 0 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -12 }}
            transition={{ duration: 0.3, ease: easeOutSoft }}
            className="flex flex-wrap gap-2"
          >
            {options.map((option, i) => {
              const on = value.includes(option);
              const Icon = icons?.[option];
              return (
                <motion.button
                  key={option}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(option)}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: easeOutSoft, delay: i * 0.02 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[14px] outline-none transition-[background-color,border-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9 sm:text-[13.5px]",
                    on
                      ? "border-cta/60 bg-columbia-soft text-foreground"
                      : "border-input text-muted-foreground hover:border-columbia hover:text-foreground"
                  )}
                >
                  {on ? (
                    <Check className="size-3.5 text-cta" aria-hidden="true" />
                  ) : Icon ? (
                    <Icon className="size-3.5" aria-hidden="true" />
                  ) : null}
                  {option}
                </motion.button>
              );
            })}

            {active.custom && (
              <span className="inline-flex h-10 items-center rounded-full border border-dashed border-input pl-3.5 pr-1 focus-within:border-columbia-deep/60 sm:h-9">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraft();
                    }
                  }}
                  placeholder="Add your own"
                  aria-label="Add your own skill"
                  maxLength={40}
                  className="w-28 bg-transparent text-base text-foreground outline-none placeholder:text-subtle-foreground sm:text-[13.5px]"
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
