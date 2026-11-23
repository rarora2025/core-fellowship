"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, X } from "lucide-react";

import { majorAliases, majorOptions } from "@/content/student-application";
import { easeOutSoft } from "@/components/motion/easing";
import { cn } from "@/lib/utils";

const fieldShell =
  "flex h-12 w-full items-center rounded-xl border border-input bg-background transition-[border-color,box-shadow] duration-300 focus-within:border-columbia-deep/60 focus-within:ring-4 focus-within:ring-columbia-soft has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-4 has-[[aria-invalid=true]]:ring-destructive/10";

const SMALL = new Set(["and", "of", "the", "&"]);
const initialsOf = (m: string) =>
  m
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((w) => w && !SMALL.has(w.toLowerCase()))
    .map((w) => w[0])
    .join("")
    .toLowerCase();

/** Ranks majors by name, short names (IEOR, econ) and initials (CS, BME). */
function searchMajors(q: string) {
  const scored = majorOptions
    .map((m) => {
      const name = m.toLowerCase();
      const aliases = majorAliases[m] ?? [];
      let score = 0;
      if (name.startsWith(q)) score = 5;
      else if (aliases.some((a) => a === q)) score = 5;
      else if (initialsOf(m) === q.replace(/\s+/g, "")) score = 4;
      else if (aliases.some((a) => a.startsWith(q))) score = 3;
      else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 2;
      else if (name.includes(q)) score = 1;
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map((x) => x.m);
}

export const MAJOR_SEP = ", ";
const MAX_MAJORS = 3;

function resolveOne(value: string) {
  const q = value.trim().toLowerCase();
  if (!q) return value.trim();
  const hit = majorOptions.find(
    (m) => m.toLowerCase() === q || (majorAliases[m] ?? []).includes(q) || initialsOf(m) === q.replace(/\s+/g, "")
  );
  return hit && q.length >= 2 ? hit : value.trim();
}

/** Turns short names ("ieor", "cs") into full majors. Handles several, comma separated. */
export function resolveMajor(value: string) {
  return [...new Set(value.split(MAJOR_SEP).map(resolveOne).filter(Boolean))].join(MAJOR_SEP);
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-foreground">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Pick up to three majors or minors. Search filters a steady list; your
 * picks sit as chips in the box. The search text is only ever a search.
 */
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
  const selected = React.useMemo(() => (value ? value.split(MAJOR_SEP).filter(Boolean) : []), [value]);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(-1);
  const listRef = React.useRef<HTMLUListElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const matches = q ? searchMajors(q) : majorOptions;
  const resolved = q ? resolveOne(query) : "";
  const custom = q && !majorOptions.includes(resolved) && !selected.includes(query.trim()) ? query.trim() : null;
  const rows = custom ? [...matches, custom] : matches;
  const full = selected.length >= MAX_MAJORS;

  React.useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop - 4;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight + 4;
  }, [active]);

  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [q]);

  function set(next: string[]) {
    onChange(next.join(MAJOR_SEP));
  }

  function toggle(m: string) {
    if (selected.includes(m)) set(selected.filter((x) => x !== m));
    else if (!full) set([...selected, m]);
    setQuery("");
    setActive(-1);
  }

  return (
    <div>
      <div
        className={cn(fieldShell, "h-auto min-h-12 cursor-text flex-wrap gap-1.5 py-1.5 pl-3 pr-2")}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="ml-1 size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
        <AnimatePresence initial={false}>
          {selected.map((m) => (
            <motion.span
              key={m}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.12 } }}
              transition={{ duration: 0.22, ease: easeOutSoft }}
              className="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-columbia-soft pl-3 pr-1 text-[13.5px] font-medium text-foreground"
            >
              <span className="truncate">{m}</span>
              <button
                type="button"
                aria-label={`Remove ${m}`}
                onClick={() => toggle(m)}
                className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          id="answer"
          role="combobox"
          aria-expanded="true"
          aria-controls="major-list"
          aria-activedescendant={active >= 0 ? `major-${active}` : undefined}
          autoFocus
          autoComplete="off"
          aria-labelledby="question"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          placeholder={selected.length ? (full ? "" : "Add another") : "Search majors"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(e.target.value.trim() ? 0 : -1);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.min(Math.max(i + (e.key === "ArrowDown" ? 1 : -1), 0), rows.length - 1));
            } else if (e.key === "Enter" && active >= 0 && rows[active]) {
              e.preventDefault();
              toggle(rows[active]);
            } else if (e.key === "Backspace" && !query && selected.length) {
              set(selected.slice(0, -1));
            } else if (e.key === "Escape") {
              setQuery("");
              setActive(-1);
            }
          }}
          className="h-9 min-w-[8rem] flex-1 bg-transparent px-1.5 text-base text-foreground outline-none placeholder:text-subtle-foreground sm:text-[15px]"
        />
      </div>

      <ul
        ref={listRef}
        id="major-list"
        role="listbox"
        aria-multiselectable="true"
        aria-label="Majors"
        className="relative mt-2 h-[228px] overflow-y-auto overscroll-contain rounded-xl border border-input p-1 [scrollbar-width:thin]"
      >
        {rows.map((m, i) => {
          const on = selected.includes(m);
          const disabled = !on && full;
          return (
            <li
              key={m}
              id={`major-${i}`}
              data-row={i}
              role="option"
              aria-selected={on}
              aria-disabled={disabled || undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => !disabled && toggle(m)}
              className={cn(
                "flex h-11 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-[15px] sm:h-10 sm:text-[14.5px]",
                on ? "text-foreground" : "text-muted-foreground",
                i === active ? "bg-muted text-foreground" : "hover:bg-muted/70 hover:text-foreground",
                disabled && "cursor-default opacity-45 hover:bg-transparent"
              )}
            >
              <span
                className={cn(
                  "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors duration-150",
                  on ? "border-cta bg-cta text-cta-foreground" : "border-input bg-background"
                )}
                aria-hidden="true"
              >
                {on && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {m === custom ? (
                  <>
                    Add <span className="font-medium text-foreground">&ldquo;{m}&rdquo;</span>
                  </>
                ) : (
                  <Highlight text={m} q={q} />
                )}
              </span>
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-3 py-2.5 text-[14px] text-muted-foreground">No matches</li>}
      </ul>
      <p className="mt-2 px-1 text-[12.5px] text-subtle-foreground">
        {full ? "That's the max of three." : "Pick one or more, including minors."}
      </p>
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
  autoFocus = true,
  id = "answer",
}: {
  value: string;
  onChange: (v: string) => void;
  describedBy?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  id?: string;
}) {
  const handle = value ? handleFrom(value) : "";
  return (
    <div className={fieldShell}>
      <span className="select-none pl-4 text-base text-subtle-foreground sm:text-[15px]" aria-hidden="true">
        linkedin.com/in/
      </span>
      <input
        id={id}
        autoFocus={autoFocus}
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
