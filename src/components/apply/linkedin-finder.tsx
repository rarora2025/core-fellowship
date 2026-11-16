"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";

import { LinkedInInput } from "@/components/apply/text-pickers";
import { easeOutSoft } from "@/components/motion/easing";
import { cn } from "@/lib/utils";

type Match = { url: string; name: string; headline: string; photo?: string };
type State =
  | { phase: "loading" }
  | { phase: "done"; available: boolean; results: Match[] };

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

const same = (a: string, b: string) =>
  a.replace(/\/+$/, "").toLowerCase() === b.replace(/\/+$/, "").toLowerCase();

/**
 * Looks the applicant up from what they've told us so far (name,
 * class year, Columbia, major) and offers "Is this you?" cards. They
 * can always paste their own link instead.
 */
export function LinkedInFinder({
  name,
  gradYear,
  major,
  value,
  onChange,
  describedBy,
  invalid,
}: {
  name: string;
  gradYear: string;
  major: string;
  value: string;
  onChange: (v: string) => void;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [state, setState] = React.useState<State>({ phase: "loading" });

  React.useEffect(() => {
    const ctrl = new AbortController();
    setState({ phase: "loading" });
    fetch("/api/linkedin-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gradYear, major }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((b: { available: boolean; results: Match[] }) =>
        setState({ phase: "done", available: b.available, results: b.results ?? [] })
      )
      .catch(() => !ctrl.signal.aborted && setState({ phase: "done", available: false, results: [] }));
    return () => ctrl.abort();
  }, [name, gradYear, major]);

  const results = state.phase === "done" ? state.results : [];
  const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${name} Columbia`
  )}`;

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {state.phase === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
            aria-live="polite"
          >
            <span className="sr-only">Looking you up</span>
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-input p-3">
                <span className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <span className="block h-3 w-3/4 animate-pulse rounded bg-muted" />
                </span>
              </div>
            ))}
          </motion.div>
        ) : results.length > 0 ? (
          <motion.ul
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
            aria-label="Possible profiles"
          >
            {results.map((m, i) => {
              const on = !!value && same(value, m.url);
              return (
                <motion.li
                  key={m.url}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeOutSoft, delay: i * 0.07 }}
                >
                  <button
                    type="button"
                    id={i === 0 ? "answer" : undefined}
                    aria-pressed={on}
                    onClick={() => onChange(on ? "" : m.url)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left outline-none transition-[background-color,border-color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      on ? "border-cta/60 bg-columbia-soft" : "border-input hover:border-columbia"
                    )}
                  >
                    <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-cta text-[13px] font-semibold text-cta-foreground">
                      {initials(m.name)}
                      {m.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo} alt="" className="absolute inset-0 size-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium">{m.name}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {m.headline || m.url.replace("https://www.", "")}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-300",
                        on ? "border-cta bg-cta text-cta-foreground" : "border-input"
                      )}
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      {state.phase === "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: easeOutSoft, delay: results.length ? 0.2 : 0 }}
          className={cn(results.length > 0 && "mt-4")}
        >
          {results.length > 0 && (
            <p className="mb-2 px-1 text-[13px] text-muted-foreground">Not you? Paste your link.</p>
          )}
          <LinkedInInput
            value={results.some((m) => same(m.url, value)) ? "" : value}
            onChange={onChange}
            describedBy={describedBy}
            invalid={invalid}
            autoFocus={results.length === 0}
            id={results.length ? "linkedin-manual" : "answer"}
          />
          {results.length === 0 && (
            <a
              href={searchUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 px-1 text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Find yours on LinkedIn
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </motion.div>
      )}
    </div>
  );
}
