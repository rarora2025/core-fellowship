"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Download, ExternalLink, FileText, Search, X } from "lucide-react";

import { CoreBulb } from "@/components/brand/core-bulb";
import { BoardHeader, onBluePill } from "@/components/board/board-tabs";
import { Input } from "@/components/ui/input";
import { easeOutSoft } from "@/components/motion/easing";
import { portalCard } from "@/components/portal/ui";
import { environmentPairs } from "@/content/profile";
import { dayParts, formatDay, formatRange, formatShortDay, formatTime, placeOf } from "@/lib/interviews";
import type { Applicant } from "@/lib/server/board";
import { cn } from "@/lib/utils";

const chip = "rounded-full bg-columbia-soft px-2.5 py-0.5 text-[13px] text-columbia-ink dark:bg-brand/15 dark:text-foreground";
const quiet = "text-[13px] text-subtle-foreground";
const selectClass =
  "h-11 w-full appearance-none rounded-xl border border-input bg-card pl-3.5 pr-9 text-[14px] outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50";
// Written out in full so Tailwind sees them.
const tableCols = "md:grid-cols-[minmax(0,1.7fr)_64px_minmax(0,1.6fr)_minmax(0,1.1fr)_170px]";

/* ------------------------------------------------------------------ */
/* Sorting, grouping, status                                            */
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

type Status = "Coming up" | "Interviewed" | "Not booked yet";
const STATUS_ORDER: Status[] = ["Coming up", "Not booked yet", "Interviewed"];

function statusOf(a: Applicant, now: number): Status {
  if (!a.booking) return "Not booked yet";
  return new Date(a.booking.end).getTime() > now ? "Coming up" : "Interviewed";
}

function groupsOf(a: Applicant, key: GroupKey, now: number): string[] {
  const p = a.profile;
  const or = (v: string[], none: string) => (v.length ? v : [none]);
  switch (key) {
    case "none":
      return ["Everyone"];
    case "status":
      return [statusOf(a, now)];
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

const yearLabel = (y: string) => (y === "Grad student" ? "Grad" : y ? `'${y.slice(-2)}` : "");

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        size === "lg" ? "size-14 bg-white/20 text-[18px] text-white" : "size-9 bg-cta/12 text-[13px] text-brand-deep dark:bg-cta/20"
      )}
    >
      {initials(name)}
    </span>
  );
}

/** A tiny calendar tile, like the booking page's day strip. */
function DateTile({ iso, on = false }: { iso: string; on?: boolean }) {
  const p = dayParts(iso);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex w-12 shrink-0 flex-col items-center rounded-xl border py-1 leading-tight",
        on ? "border-white/40 bg-white/15 text-white" : "border-border bg-card"
      )}
    >
      <span className={cn("text-[10px] font-semibold uppercase tracking-[0.08em]", on ? "text-white/80" : "text-muted-foreground")}>{p.weekday}</span>
      <span className="font-display text-[18px] font-bold">{p.day}</span>
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h3>
      <dl className="grid gap-2.5">{children}</dl>
    </section>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="grid gap-1.5 sm:grid-cols-[110px_1fr] sm:gap-3">
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

/* ------------------------------------------------------------------ */
/* One person, in full (the pop-out)                                     */
/* ------------------------------------------------------------------ */

function Person({ a, onClose }: { a: Applicant; onClose: () => void }) {
  const reduce = !!useReducedMotion();
  const p = a.profile;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const link =
    "inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-[14px] transition-colors hover:bg-muted";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={a.name}
        initial={{ x: reduce ? 0 : 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reduce ? 0 : 48, opacity: 0 }}
        transition={{ duration: 0.45, ease: easeOutSoft }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-[580px] overflow-y-auto bg-background shadow-[-24px_0_48px_-24px_rgb(var(--shadow-color)/0.4)]"
      >
        {/* Header band, like the booking card */}
        <div className="relative overflow-hidden bg-cta px-6 pb-6 pt-5 text-white sm:px-8">
          <CoreBulb className="pointer-events-none absolute -right-2 -top-3 h-36 w-auto text-white/15" />
          <div className="relative flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              autoFocus
              className="-mr-2 grid size-10 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="size-[18px]" />
            </button>
          </div>
          <div className="relative flex items-center gap-4">
            <Avatar name={a.name || a.email} size="lg" />
            <div className="min-w-0">
              <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em]">{a.name || a.email}</h2>
              <p className="mt-0.5 text-[14px] text-white/85">
                {[a.gradYear && (a.gradYear === "Grad student" ? "Grad student" : `Class of ${a.gradYear}`), a.major].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="relative mt-5 flex items-center gap-3 rounded-2xl bg-white/12 p-3">
            {a.booking ? (
              <>
                <DateTile iso={a.booking.start} on />
                <div className="min-w-0 text-[14px]">
                  <p className="font-medium">
                    {formatDay(a.booking.start)}, {formatRange(a.booking)}
                  </p>
                  <p className="text-white/80">
                    {placeOf(a.booking).label}
                  </p>
                </div>
              </>
            ) : (
              <p className="px-1 text-[14px] text-white/85">Hasn&apos;t booked a conversation yet.</p>
            )}
          </div>
        </div>

        <div className="grid gap-7 px-6 py-7 sm:px-8">
          <Section title="What they're good at">
            <Row label="Describes self" values={p.builderTypes} />
            <Row label="Fluent in" values={p.skills} />
          </Section>
          <Section title="What they're into">
            <Row label="Wants to do" values={p.roles} />
            <Row label="Spaces" values={p.interests} />
            <Row label="Outside class" values={p.fascinations} />
          </Section>
          <Section title="How they like to work">
            <Row label="Style" values={envWords(p)} />
            <Row label="Company size" values={p.companySize.map((c) => (c === "No preference" ? "Any size" : c))} />
          </Section>
          <Section title="Logistics">
            <Row label="Where" values={p.location} />
            <Row label="Work auth" values={p.workAuth} />
            {a.referrals.length > 0 && <Row label="Would refer" values={a.referrals.map((r) => r.name || r.email)} />}
          </Section>

          <div className="flex flex-wrap gap-2 border-t border-border pt-6">
            {a.resumeId && (
              <a href={`/api/board/resume/${a.resumeId}`} target="_blank" rel="noreferrer" className={cn(link, "border-cta bg-cta font-medium text-white hover:bg-cta/90")}>
                <FileText className="size-4" aria-hidden="true" />
                Resume
              </a>
            )}
            {a.linkedin && (
              <a href={a.linkedin} target="_blank" rel="noreferrer" className={link}>
                LinkedIn
                <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </a>
            )}
            {a.workLink && (
              <a href={a.workLink} target="_blank" rel="noreferrer" className={link}>
                Their work
                <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </a>
            )}
          </div>
          <div className="-mt-3">
            <p className="select-all text-[14px]">{a.email}</p>
            <p className={cn(quiet, "mt-0.5")}>
              Applied {new Date(a.receivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
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
    <label className="relative flex min-w-0 items-center">
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

type StatKey = "all" | Status;

/** Everyone who applied: numbers, who's next, then the table to search, sort and pool. */
export function BoardView({
  applicants,
  canSignOut = true,
}: {
  applicants: Applicant[];
  /** Off on localhost, where the board is always open. */
  canSignOut?: boolean;
}) {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const [q, setQ] = React.useState("");
  const [stat, setStat] = React.useState<StatKey>("all");
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

  const counts = React.useMemo(() => {
    const c: Record<StatKey, number> = { all: applicants.length, "Coming up": 0, Interviewed: 0, "Not booked yet": 0 };
    for (const a of applicants) c[statusOf(a, now)]++;
    return c;
  }, [applicants, now]);

  const upcoming = React.useMemo(
    () =>
      applicants
        .filter((a) => statusOf(a, now) === "Coming up")
        .sort((a, b) => a.booking!.start.localeCompare(b.booking!.start))
        .slice(0, 8),
    [applicants, now]
  );

  const shown = React.useMemo(() => {
    const text = q.trim().toLowerCase();
    return applicants
      .filter((a) => {
        if (stat !== "all" && statusOf(a, now) !== stat) return false;
        if (!text) return true;
        const p = a.profile;
        return [a.name, a.email, a.major, a.gradYear, ...p.roles, ...p.interests, ...p.skills, ...p.fascinations, ...p.builderTypes, ...p.location]
          .join(" ")
          .toLowerCase()
          .includes(text);
      })
      .sort(compare(sort));
  }, [applicants, q, stat, sort, now]);

  const pools = React.useMemo(() => {
    const map = new Map<string, Applicant[]>();
    for (const a of shown) for (const g of groupsOf(a, group, now)) map.set(g, [...(map.get(g) ?? []), a]);
    const entries = [...map.entries()];
    if (group === "status") entries.sort((x, y) => STATUS_ORDER.indexOf(x[0] as Status) - STATUS_ORDER.indexOf(y[0] as Status));
    else if (group !== "none")
      entries.sort((x, y) => Number(isLeftover(x[0])) - Number(isLeftover(y[0])) || y[1].length - x[1].length || x[0].localeCompare(y[0]));
    return entries;
  }, [shown, group, now]);

  async function signOut() {
    await fetch("/api/board/session", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  const stats: { key: StatKey; label: string }[] = [
    { key: "all", label: "Applied" },
    { key: "Coming up", label: "Coming up" },
    { key: "Interviewed", label: "Interviewed" },
    { key: "Not booked yet", label: "Not booked yet" },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-10 sm:px-8 sm:pt-12">
      {/* Title */}
      <BoardHeader
        title="Applicants"
        active="applicants"
        subtitle={`${counts.all} applied · ${counts["Coming up"]} coming up · ${counts.Interviewed} interviewed`}
        actions={
          <>
            <a href="/api/board/export" className={onBluePill}>
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </a>
            {canSignOut && (
              <button type="button" onClick={signOut} className={cn(onBluePill, "text-white/85")}>
                Sign out
              </button>
            )}
          </>
        }
      />

      {/* Numbers, which also filter */}
      <div role="radiogroup" aria-label="Show" className="mt-8 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {stats.map((s) => {
          const on = stat === s.key;
          return (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setStat(on && s.key !== "all" ? "all" : s.key)}
              className={cn(
                "relative overflow-hidden rounded-[20px] border p-4 text-left outline-none transition-[background-color,border-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:p-5",
                on ? "border-cta bg-cta text-white" : "border-border bg-card hover:border-cta/50"
              )}
            >
              {on && s.key === "all" && <CoreBulb className="pointer-events-none absolute -bottom-6 -right-1 h-24 w-auto text-white/15" />}
              <span className={cn("relative block text-[13px]", on ? "text-white/85" : "text-muted-foreground")}>{s.label}</span>
              <span className="relative mt-1 block font-display text-[32px] font-bold leading-none tracking-[-0.02em]">{counts[s.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Who's next */}
      {upcoming.length > 0 && (
        <section aria-labelledby="next" className="mt-10">
          <h2 id="next" className="text-[16px] font-medium tracking-[-0.01em]">
            Next up
          </h2>
          <ol className="mt-3 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {upcoming.map((a) => (
              <li key={a.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setOpen(a)}
                  className={cn(portalCard, "flex w-[260px] items-center gap-3 p-3 text-left outline-none transition-colors hover:border-cta/50 focus-visible:ring-[3px] focus-visible:ring-ring/50")}
                >
                  <DateTile iso={a.booking!.start} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{a.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {formatTime(a.booking!.start)} · {placeOf(a.booking!).label}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Tools */}
      <div className="mt-10 flex flex-col gap-2.5 lg:flex-row lg:items-center">
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
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
          <Picker label="Group by" value={group} options={GROUPS} onChange={setGroup} />
          <Picker label="Sort" value={sort} options={SORTS} onChange={setSort} />
        </div>
      </div>

      {MANY.includes(group) && (
        <p className={cn(quiet, "mt-3 px-1")}>Someone who picked more than one shows up in each pool they picked.</p>
      )}

      {/* The table */}
      <div className="mt-6 grid gap-8">
        {pools.map(([name, people]) => (
          <motion.section
            key={`${group}:${name}`}
            aria-label={name}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOutSoft }}
          >
            {group !== "none" && (
              <h2 className="mb-2.5 flex items-center gap-2 px-1 text-[16px] font-medium tracking-[-0.01em]">
                {name}
                <span className="rounded-full bg-columbia-soft px-2 py-0.5 text-[12px] font-semibold text-brand-deep dark:bg-brand/15">{people.length}</span>
              </h2>
            )}
            <div className={cn(portalCard, "overflow-hidden p-1.5")}>
              <div className={cn("hidden gap-4 px-3.5 pb-2 pt-2.5 md:grid", tableCols, quiet)} aria-hidden="true">
                <span>Name</span>
                <span>Year</span>
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
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={a.name || a.email} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-medium">{a.name || a.email}</span>
                          <span className="block truncate text-[13px] text-muted-foreground">{a.major}</span>
                        </span>
                      </span>
                      <span className="hidden text-[14px] text-muted-foreground md:block">{yearLabel(a.gradYear)}</span>
                      <span className="hidden min-w-0 flex-wrap gap-1 md:flex">
                        {a.profile.roles.slice(0, 2).map((r) => (
                          <span key={r} className={cn(chip, "max-w-full truncate text-[12.5px]")}>
                            {r}
                          </span>
                        ))}
                        {a.profile.roles.length > 2 && <span className={cn(quiet, "self-center")}>+{a.profile.roles.length - 2}</span>}
                      </span>
                      <span className="hidden min-w-0 truncate text-[14px] text-muted-foreground md:block">{a.profile.interests.join(", ")}</span>
                      <span className="flex items-center justify-end gap-2 text-right">
                        {a.booking ? (
                          <span className="min-w-0">
                            <span
                              className={cn(
                                "inline-block rounded-full px-2.5 py-0.5 text-[13px] font-medium",
                                statusOf(a, now) === "Coming up" ? "bg-cta/12 text-brand-deep dark:bg-cta/20" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {formatShortDay(a.booking.start)} · {formatTime(a.booking.start)}
                            </span>
                            <span className={cn(quiet, "mt-0.5 block")}>{placeOf(a.booking).label}</span>
                          </span>
                        ) : (
                          <span className={quiet}>Not booked</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        ))}
        {!shown.length && (
          <div className={cn(portalCard, "flex flex-col items-center gap-3 p-10 text-center")}>
            <CoreBulb className="h-12 w-auto text-cta/40" />
            <p className="text-[15px] text-muted-foreground">
              {applicants.length ? "No one matches that." : "No applicants yet. They'll show up here as they apply."}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>{open && <Person key={open.id} a={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </main>
  );
}
