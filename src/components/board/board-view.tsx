"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Download, ExternalLink, FileText, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { easeOutSoft } from "@/components/motion/easing";
import { portalCard, portalTitle } from "@/components/portal/ui";
import { environmentPairs } from "@/content/profile";
import { formatShortDay, formatTime, placeOf } from "@/lib/interviews";
import type { Applicant } from "@/lib/server/board";
import { cn } from "@/lib/utils";

const chip = "rounded-full bg-columbia-soft px-2.5 py-0.5 text-[13px] text-columbia-ink dark:bg-brand/15 dark:text-foreground";
const quiet = "text-[13px] text-subtle-foreground";
const linkClass =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[13.5px] transition-colors hover:bg-muted";
const selectClass =
  "h-11 appearance-none rounded-xl border border-input bg-card pl-3.5 pr-9 text-[14px] outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50";
// Written out in full so Tailwind sees them.
const tableCols = "md:grid-cols-[minmax(0,1.4fr)_64px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_150px]";

/* ------------------------------------------------------------------ */
/* Sorting and grouping                                                 */
/* ------------------------------------------------------------------ */

const SORTS = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name A–Z",
  interview: "Interview time",
  year: "Grad year",
} as const;
type SortKey = keyof typeof SORTS;

const GROUPS = {
  none: "No grouping",
  status: "Interview",
  interviewer: "Interviewer",
  roles: "Wants to do",
  interests: "Spaces",
  year: "Grad year",
  location: "Where",
  workAuth: "Work authorization",
  builder: "Technical / creative / artist",
  size: "Company size",
} as const;
type GroupKey = keyof typeof GROUPS;

/** Groups where one person can land in several pools. */
const MANY: GroupKey[] = ["roles", "interests", "location", "builder", "size"];

function statusOf(a: Applicant, now: number) {
  if (!a.booking) return "Not booked yet";
  return new Date(a.booking.end).getTime() > now ? "Booked" : "Interviewed";
}

function groupsOf(a: Applicant, key: GroupKey, now: number): string[] {
  const p = a.profile;
  const or = (v: string[], none: string) => (v.length ? v : [none]);
  switch (key) {
    case "none":
      return ["Everyone"];
    case "status":
      return [statusOf(a, now)];
    case "interviewer":
      return [a.booking?.interviewerName ?? "No interviewer yet"];
    case "roles":
      return or(p.roles, "No answer");
    case "interests":
      return or(p.interests, "No answer");
    case "year":
      return [a.gradYear || "No answer"];
    case "location":
      return or(p.location, "No answer");
    case "workAuth":
      return or(p.workAuth, "No answer");
    case "builder":
      return or(p.builderTypes, "None picked");
    case "size":
      return or(p.companySize, "No answer");
  }
}

const STATUS_ORDER = ["Booked", "Not booked yet", "Interviewed"];
const isLeftover = (name: string) => /^(No |None )/.test(name);

function compare(sort: SortKey) {
  return (a: Applicant, b: Applicant) => {
    switch (sort) {
      case "newest":
        return b.receivedAt.localeCompare(a.receivedAt);
      case "oldest":
        return a.receivedAt.localeCompare(b.receivedAt);
      case "name":
        return a.name.localeCompare(b.name);
      case "interview":
        return (a.booking?.start ?? "~").localeCompare(b.booking?.start ?? "~");
      case "year":
        return (a.gradYear || "~").localeCompare(b.gradYear || "~");
    }
  };
}

function envWords(p: Applicant["profile"]) {
  return environmentPairs
    .map(({ key, left, right }) => {
      const c = p.environment[key];
      return c === "left" ? left : c === "right" ? right : c === "either" ? `${left} or ${right}` : "";
    })
    .filter(Boolean);
}

const when = (a: Applicant) => (a.booking ? `${formatShortDay(a.booking.start)}, ${formatTime(a.booking.start)}` : "");

/* ------------------------------------------------------------------ */
/* One person, in full (the pop-out)                                     */
/* ------------------------------------------------------------------ */

function Row({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="grid gap-1.5 sm:grid-cols-[120px_1fr] sm:gap-3">
      <dt className={cn(quiet, "pt-0.5")}>{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className={chip}>
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

function Person({ a, onClose }: { a: Applicant; onClose: () => void }) {
  const reduce = !!useReducedMotion();
  const p = a.profile;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={a.name}
        initial={{ x: reduce ? 0 : 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reduce ? 0 : 40, opacity: 0 }}
        transition={{ duration: 0.4, ease: easeOutSoft }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-[560px] overflow-y-auto border-l border-border bg-background p-6 pb-16 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em]">{a.name || a.email}</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {[a.gradYear && (a.gradYear === "Grad student" ? "Grad student" : `Class of ${a.gradYear}`), a.major].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            autoFocus
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className={cn(portalCard, "mt-6 p-4 text-[14px]")}>
          {a.booking ? (
            <>
              <span className="font-medium">{when(a)}</span>
              <span className={cn(quiet, "block")}>
                with {a.booking.interviewerName} · {placeOf(a.booking).label}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Hasn&apos;t booked a conversation yet.</span>
          )}
        </div>

        <dl className="mt-6 grid gap-3">
          <Row label="Where" values={p.location} />
          <Row label="Work auth" values={p.workAuth} />
          <Row label="Good at" values={[...p.builderTypes, ...p.skills]} />
          <Row label="Wants to do" values={p.roles} />
          <Row label="Spaces" values={p.interests} />
          <Row label="Outside class" values={p.fascinations} />
          <Row label="How they work" values={[...envWords(p), ...p.companySize.map((c) => (c === "No preference" ? "Any size" : c))]} />
          {a.referrals.length > 0 && <Row label="Would refer" values={a.referrals.map((r) => r.name || r.email)} />}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          {a.resumeId && (
            <a href={`/api/board/resume/${a.resumeId}`} target="_blank" rel="noreferrer" className={linkClass}>
              <FileText className="size-4" aria-hidden="true" />
              Resume
            </a>
          )}
          {a.linkedin && (
            <a href={a.linkedin} target="_blank" rel="noreferrer" className={linkClass}>
              LinkedIn
              <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </a>
          )}
          {a.workLink && (
            <a href={a.workLink} target="_blank" rel="noreferrer" className={linkClass}>
              Their work
              <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </a>
          )}
        </div>
        <p className={cn(quiet, "mt-4 select-all")}>{a.email}</p>
        <p className={cn(quiet, "mt-1")}>Applied {new Date(a.receivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
      </motion.aside>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* The board                                                            */
/* ------------------------------------------------------------------ */

function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <label className="relative flex items-center">
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={selectClass} aria-label={label}>
        {(Object.keys(options) as T[]).map((k) => (
          <option key={k} value={k}>
            {k === "none" ? options[k] : `${label}: ${options[k]}`}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" aria-hidden="true" />
    </label>
  );
}

/** Everyone who applied, as a table: search, sort, group into pools, open anyone for the full picture. */
export function BoardView({
  applicants,
  interviewers,
  canSignOut = true,
}: {
  applicants: Applicant[];
  interviewers: string[];
  /** Off on localhost, where the board is always open. */
  canSignOut?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [who, setWho] = React.useState<string>("Everyone");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [group, setGroup] = React.useState<GroupKey>("none");
  const [open, setOpen] = React.useState<Applicant | null>(null);
  const [now] = React.useState(() => Date.now());

  // Remember how each of you likes the board laid out (this browser only).
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("core:board") ?? "{}");
      if (saved.sort in SORTS) setSort(saved.sort);
      if (saved.group in GROUPS) setGroup(saved.group);
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem("core:board", JSON.stringify({ sort, group }));
    } catch {}
  }, [sort, group]);

  const shown = React.useMemo(() => {
    const text = q.trim().toLowerCase();
    return applicants
      .filter((a) => {
        if (who !== "Everyone" && a.booking?.interviewerName !== who) return false;
        if (!text) return true;
        const p = a.profile;
        return [a.name, a.email, a.major, a.gradYear, ...p.roles, ...p.interests, ...p.skills, ...p.fascinations, ...p.builderTypes, ...p.location]
          .join(" ")
          .toLowerCase()
          .includes(text);
      })
      .sort(compare(sort));
  }, [applicants, q, who, sort]);

  const pools = React.useMemo(() => {
    const map = new Map<string, Applicant[]>();
    for (const a of shown) for (const g of groupsOf(a, group, now)) map.set(g, [...(map.get(g) ?? []), a]);
    const entries = [...map.entries()];
    if (group === "status") entries.sort((x, y) => STATUS_ORDER.indexOf(x[0]) - STATUS_ORDER.indexOf(y[0]));
    else if (group !== "none")
      entries.sort((x, y) => Number(isLeftover(x[0])) - Number(isLeftover(y[0])) || y[1].length - x[1].length || x[0].localeCompare(y[0]));
    return entries;
  }, [shown, group, now]);

  const booked = applicants.filter((a) => a.booking).length;
  const upcoming = applicants.filter((a) => a.booking && new Date(a.booking.end).getTime() > now).length;

  async function signOut() {
    await fetch("/api/board/session", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  return (
    <main id="main" className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={portalTitle}>Applicants</h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            {applicants.length} applied · {booked} booked · {upcoming} coming up
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/board/export" className={linkClass}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </a>
          {canSignOut && (
            <button type="button" onClick={signOut} className={cn(linkClass, "text-muted-foreground")}>
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Search applicants"
            placeholder="Search names, majors, roles, spaces, tools…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Picker label="Group by" value={group} options={GROUPS} onChange={setGroup} />
          <Picker label="Sort" value={sort} options={SORTS} onChange={setSort} />
          <div role="radiogroup" aria-label="Interviewer" className="flex rounded-xl bg-muted p-1">
            {["Everyone", ...interviewers].map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={who === name}
                onClick={() => setWho(name)}
                className={cn(
                  "h-9 rounded-lg px-3 text-[14px] transition-colors",
                  who === name
                    ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgb(var(--shadow-color)/0.12)] dark:bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {MANY.includes(group) && (
        <p className={cn(quiet, "mt-3 px-1")}>Someone who picked more than one shows up in each pool they picked.</p>
      )}

      <div className="mt-6 grid gap-8">
        {pools.map(([name, people]) => (
          <section key={name} aria-label={name}>
            {group !== "none" && (
              <h2 className="mb-2.5 flex items-baseline gap-2 px-1 text-[16px] font-medium tracking-[-0.01em]">
                {name} <span className="text-[14px] font-normal text-subtle-foreground">{people.length}</span>
              </h2>
            )}
            <div className={cn(portalCard, "overflow-hidden p-1.5")}>
              <div className={cn("hidden gap-4 px-3.5 pb-2 pt-2.5 md:grid", tableCols, quiet)} aria-hidden="true">
                <span>Name</span>
                <span>Year</span>
                <span>Major</span>
                <span>Wants to do</span>
                <span>Spaces</span>
                <span className="text-right">Interview</span>
              </div>
              <ul className="divide-y divide-border">
                {people.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(a)}
                      className={cn(
                        "grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-xl px-3.5 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        tableCols
                      )}
                    >
                      <span className="min-w-0 truncate text-[15px] font-medium">{a.name || a.email}</span>
                      <span className="hidden text-[14px] text-muted-foreground md:block">{a.gradYear.replace("Grad student", "Grad")}</span>
                      <span className="hidden min-w-0 truncate text-[14px] text-muted-foreground md:block">{a.major}</span>
                      <span className="hidden min-w-0 truncate text-[14px] md:block">{a.profile.roles.join(", ")}</span>
                      <span className="hidden min-w-0 truncate text-[14px] text-muted-foreground md:block">{a.profile.interests.join(", ")}</span>
                      <span className="row-span-2 text-right text-[13.5px] md:row-span-1">
                        {a.booking ? (
                          <>
                            <span className="block">{when(a)}</span>
                            <span className={quiet}>{a.booking.interviewerName}</span>
                          </>
                        ) : (
                          <span className={quiet}>Not booked</span>
                        )}
                      </span>
                      <span className={cn(quiet, "col-start-1 truncate md:hidden")}>
                        {[a.gradYear, a.profile.roles.join(", ")].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
        {!shown.length && <p className="text-[14px] text-muted-foreground">No one matches that.</p>}
      </div>

      <AnimatePresence>{open && <Person key={open.id} a={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </main>
  );
}
