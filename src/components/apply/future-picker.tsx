"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";

import { easeOutSoft } from "@/components/motion/easing";
import { interestOptions, roleOptions, skillSuggestions } from "@/content/student-application";
import type { StudentApplication, StudentField } from "@/lib/applications/student";
import { cn } from "@/lib/utils";

type Key = "skills" | "interests" | "roles";
type TextKey = "skillsText" | "interestsText" | "rolesText";

/** Words people type → the tag we file it under. Matched as whole words. */
const dictionaries: Record<Key, Record<string, string[]>> = {
  skills: {
    Python: ["python", "pandas", "numpy"],
    TypeScript: ["typescript", "javascript", "js", "ts", "node"],
    React: ["react", "next.js", "nextjs", "frontend", "front end"],
    SQL: ["sql", "postgres", "databases"],
    "Machine learning": ["machine learning", "ml", "deep learning", "pytorch", "llm", "llms", "ai"],
    iOS: ["ios", "swift", "mobile"],
    Figma: ["figma", "prototyping"],
    "User research": ["user research", "interviews", "ux research"],
    "Financial modeling": ["financial modeling", "modeling", "dcf", "valuation"],
    Excel: ["excel", "spreadsheets"],
    Writing: ["writing", "copywriting", "content", "storytelling"],
    Sales: ["sales", "selling", "cold email"],
  },
  interests: {
    AI: ["ai", "ml", "llm", "llms", "machine learning", "agents"],
    Fintech: ["fintech", "payments", "banking", "finance", "trading", "markets"],
    Climate: ["climate", "energy", "sustainability", "clean tech", "cleantech"],
    Health: ["health", "healthcare", "bio", "biotech", "medical", "medicine"],
    Consumer: ["consumer", "social", "apps", "d2c", "dtc"],
    "Developer tools": ["devtools", "developer tools", "infra", "infrastructure", "open source"],
    Education: ["education", "edtech", "learning"],
    Media: ["media", "creator", "creators", "music", "film", "gaming", "games"],
    Marketplaces: ["marketplace", "marketplaces"],
    Hardware: ["hardware", "robotics", "robots", "drones"],
    Crypto: ["crypto", "web3", "blockchain", "defi"],
    "Open to anything": ["open to anything", "not sure", "anything really", "no idea"],
  },
  roles: {
    "Software engineering": ["engineering", "engineer", "swe", "software", "developer", "coding", "build"],
    Product: ["product", "pm", "product manager"],
    Design: ["design", "designer", "ux", "ui"],
    Data: ["data", "analytics", "analyst", "data science"],
    "Growth and marketing": ["growth", "marketing", "brand"],
    Operations: ["operations", "ops", "chief of staff", "bizops"],
    "Sales and partnerships": ["sales", "partnerships", "bd", "business development"],
    Finance: ["finance", "vc", "venture", "investing", "fp&a"],
    Research: ["research", "researcher"],
  },
};

const sections: {
  key: Key;
  text: TextKey;
  label: string;
  placeholder: string;
  suggestions: string[];
  tint: string;
  chip: string;
  dot: string;
}[] = [
  {
    key: "skills",
    text: "skillsText",
    label: "What you're good at",
    placeholder: "Python, talking to users, building things fast",
    suggestions: skillSuggestions,
    tint: "focus-within:border-sky-400/60 focus-within:ring-sky-100 dark:focus-within:ring-sky-500/15",
    chip: "bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:ring-sky-400/25",
    dot: "bg-sky-500",
  },
  {
    key: "interests",
    text: "interestsText",
    label: "Spaces you care about",
    placeholder: "Fintech, climate, anything with AI",
    suggestions: interestOptions,
    tint: "focus-within:border-violet-400/60 focus-within:ring-violet-100 dark:focus-within:ring-violet-500/15",
    chip: "bg-violet-50 text-violet-900 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-100 dark:ring-violet-400/25",
    dot: "bg-violet-500",
  },
  {
    key: "roles",
    text: "rolesText",
    label: "The role you want",
    placeholder: "Product, or engineering on a small team",
    suggestions: roleOptions,
    tint: "focus-within:border-emerald-400/60 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-500/15",
    chip: "bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-400/25",
    dot: "bg-emerald-500",
  },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordIn = (w: string, text: string) => new RegExp(`(^|[^a-z0-9])${escape(w)}([^a-z0-9]|$)`).test(text);
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Pulls tags out of free text: known words map to our tags, and short
 * comma-separated bits ("rust, cold outreach") become their own tags.
 */
function extract(key: Key, text: string) {
  const lower = ` ${text.toLowerCase()} `;
  const found: string[] = [];
  for (const [tag, words] of Object.entries(dictionaries[key])) {
    if (words.some((w) => wordIn(w, lower))) found.push(tag);
  }
  if (key === "skills") {
    for (const part of text.split(/[,\n;]+/)) {
      const p = part.trim().replace(/^(and|or)\s+/i, "");
      if (!p || p.split(/\s+/).length > 3 || p.length > 28) continue;
      const known = Object.entries(dictionaries.skills).some(([tag, words]) =>
        [tag.toLowerCase(), ...words].some((w) => wordIn(w, ` ${p.toLowerCase()} `))
      );
      if (!known) found.push(titleCase(p));
    }
  }
  return [...new Set(found)];
}

/**
 * Three short prompts answered in your own words. As you type, what you
 * mean gets condensed into tags you can keep, remove, or add to.
 */
export function FuturePicker({
  data,
  onChange,
  describedBy,
  focusField,
}: {
  data: StudentApplication;
  onChange: <K extends StudentField>(key: K, value: StudentApplication[K]) => void;
  describedBy?: string;
  focusField?: StudentField | null;
}) {
  return (
    <div className="flex flex-col gap-6" aria-describedby={describedBy}>
      {sections.map((s, i) => (
        <Section
          key={s.key}
          section={s}
          index={i}
          text={data[s.text]}
          tags={data[s.key]}
          onText={(t) => onChange(s.text, t)}
          onTags={(t) => onChange(s.key, t)}
          highlight={focusField === s.key}
        />
      ))}
    </div>
  );
}

function Section({
  section,
  index,
  text,
  tags,
  onText,
  onTags,
  highlight,
}: {
  section: (typeof sections)[number];
  index: number;
  text: string;
  tags: string[];
  onText: (t: string) => void;
  onTags: (t: string[]) => void;
  highlight?: boolean;
}) {
  const reduce = !!useReducedMotion();
  const ref = React.useRef<HTMLTextAreaElement>(null);
  // Tags someone removed stay removed even if the words are still typed.
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  // Tags added by tapping a suggestion, kept even if not in the text.
  const [extras, setExtras] = React.useState<string[]>(() => {
    const fromText = extract(section.key, text);
    return tags.filter((t) => !fromText.includes(t));
  });

  const compute = React.useCallback(
    (t: string, ex: string[], dis: string[]) =>
      [...new Set([...extract(section.key, t), ...ex])].filter((x) => !dis.includes(x)),
    [section.key]
  );

  React.useEffect(() => {
    if (highlight) ref.current?.focus();
  }, [highlight]);

  // Grow the box with its content.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [text]);

  function update(t: string, ex = extras, dis = dismissed) {
    onText(t);
    onTags(compute(t, ex, dis));
  }

  const suggestions = section.suggestions.filter((s) => !tags.includes(s)).slice(0, 4);
  const id = `future-${section.key}`;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easeOutSoft, delay: 0.15 + index * 0.08 }}
    >
      <label htmlFor={id} className="flex items-center gap-2 px-1 text-[13px] font-medium text-foreground">
        <span className={cn("size-1.5 rounded-full", section.dot)} aria-hidden="true" />
        {section.label}
      </label>

      <div
        className={cn(
          "mt-2 rounded-xl border border-input bg-background transition-[border-color,box-shadow] duration-300 focus-within:ring-4",
          section.tint,
          highlight && !tags.length && "border-destructive ring-4 ring-destructive/10"
        )}
      >
        <textarea
          ref={ref}
          id={index === 0 ? "answer" : id}
          rows={1}
          value={text}
          maxLength={500}
          placeholder={section.placeholder}
          onChange={(e) => update(e.target.value)}
          className="block w-full resize-none bg-transparent px-4 py-3 text-base leading-relaxed text-foreground outline-none placeholder:text-subtle-foreground sm:text-[15px]"
        />

        <AnimatePresence initial={false}>
          {tags.length > 0 && (
            <motion.ul
              key="tags"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutSoft }}
              className="flex flex-wrap gap-1.5 overflow-hidden px-3 pb-3"
              aria-label={`${section.label} tags`}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {tags.map((t) => (
                  <motion.li
                    key={t}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: easeOutSoft }}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-full pl-2.5 pr-1 text-[12.5px] font-medium ring-1 ring-inset",
                      section.chip
                    )}
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove ${t}`}
                      onClick={() => {
                        const dis = [...dismissed, t];
                        const ex = extras.filter((x) => x !== t);
                        setDismissed(dis);
                        setExtras(ex);
                        update(text, ex, dis);
                      }}
                      className="grid size-5 place-items-center rounded-full opacity-60 transition-opacity hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 px-1 text-[12.5px] text-subtle-foreground">
          <span className="mr-0.5">Try</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const ex = [...extras, s];
                const dis = dismissed.filter((x) => x !== s);
                setExtras(ex);
                setDismissed(dis);
                update(text, ex, dis);
              }}
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3" aria-hidden="true" />
              {s}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
