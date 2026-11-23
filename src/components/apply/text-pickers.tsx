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

/** Turns an exact short name ("ieor", "cs") into the full major. */
export function resolveMajor(value: string) {
  const q = value.trim().toLowerCase();
  if (!q) return value;
  const hit = majorOptions.find(
    (m) => m.toLowerCase() === q || (majorAliases[m] ?? []).includes(q) || initialsOf(m) === q.replace(/\s+/g, "")
  );
  return hit && q.length >= 2 ? hit : value;
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
 * Type to filter, tap or arrow to pick. Your pick stays put while you
 * edit the text, so deleting a letter never throws it away.
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
  const [query, setQuery] = React.useState(value);
  const [active, setActive] = React.useState(0);
  // The list folds away once you've picked, and opens again when you search.
  const [open, setOpen] = React.useState(!majorOptions.includes(value));
  const listRef = React.useRef<HTMLUListElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const picked = majorOptions.includes(value) ? value : null;

  const q = query.trim().toLowerCase();
  const browsing = !q || query === picked;
  const matches = browsing ? majorOptions : searchMajors(q);
  const editingPick = !!picked && picked.toLowerCase().startsWith(q);
  const custom = !browsing && !editingPick && !matches.some((m) => m.toLowerCase() === q) ? query.trim() : null;
  const rows = custom ? [...matches, custom] : matches;

  // Keep the picked or highlighted row in view.
  React.useEffect(() => {
    const target = browsing && picked ? majorOptions.indexOf(picked) : active;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-row="${target}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop - 4;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight + 4;
  }, [active, browsing, picked, open]);

  function pick(m: string, viaTap = false) {
    setOpen(false);
    setQuery(m);
    onChange(m);
    setActive(0);
    // Show the start of a long name, not the end.
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      if (viaTap) el.blur();
      el.scrollLeft = 0;
      if (!viaTap) el.setSelectionRange(m.length, m.length);
    });
  }

  return (
    <div>
      <div className={fieldShell}>
        <Search className="ml-4 size-4 shrink-0 text-subtle-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id="answer"
          role="combobox"
          aria-expanded={open}
          aria-controls="major-list"
          aria-activedescendant={rows.length ? `major-${active}` : undefined}
          autoFocus
          autoComplete="off"
          aria-labelledby="question"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          placeholder="Search majors"
          value={query}
          onChange={(e) => {
            const t = e.target.value;
            setQuery(t);
            setActive(0);
            setOpen(true);
            // Deleting back through your pick keeps it. Typing something new replaces it.
            const keep = picked && picked.toLowerCase().startsWith(t.trim().toLowerCase());
            if (!keep) onChange(t);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(Math.max(i + (e.key === "ArrowDown" ? 1 : -1), 0), rows.length - 1));
            } else if (e.key === "Enter" && open && rows[active] && (!browsing || active > 0 || !picked) && rows[active] !== value) {
              e.preventDefault();
              pick(rows[active]);
            }
          }}
          className="h-full min-w-0 flex-1 truncate bg-transparent px-3 text-base text-foreground outline-none placeholder:text-subtle-foreground sm:text-[15px]"
        />
        <AnimatePresence initial={false}>
          {query && (
            <motion.button
              type="button"
              aria-label="Clear search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setQuery("");
                setOpen(true);
                document.getElementById("answer")?.focus();
              }}
              className="mr-2 grid size-8 shrink-0 place-items-center rounded-full text-subtle-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {open && rows.length > 0 && (
        <motion.ul
          key="list"
          ref={listRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: easeOutSoft }}
          id="major-list"
          role="listbox"
          aria-label="Majors"
          className="relative mt-2 max-h-[236px] origin-top overflow-y-auto overscroll-contain rounded-xl border border-input p-1 [scrollbar-width:thin]"
        >
          {rows.map((m, i) => {
            const on = m === picked || (custom === m && value === m);
            const isCustom = custom === m;
            return (
              <li
                key={`${m}-${i}`}
                id={`major-${i}`}
                data-row={i}
                role="option"
                aria-selected={on}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(m, true)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[15px] transition-colors duration-150 sm:h-10 sm:text-[14.5px]",
                  on ? "bg-columbia-soft text-foreground" : "text-muted-foreground",
                  !on && i === active && !browsing && "bg-muted text-foreground",
                  !on && "hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  {isCustom ? (
                    <>
                      Use <span className="font-medium text-foreground">&ldquo;{m}&rdquo;</span>
                    </>
                  ) : (
                    <Highlight text={m} q={browsing ? "" : q} />
                  )}
                </span>
                {on && <Check className="size-4 shrink-0 text-cta" aria-hidden="true" />}
              </li>
            );
          })}
        </motion.ul>
        )}
      </AnimatePresence>
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
