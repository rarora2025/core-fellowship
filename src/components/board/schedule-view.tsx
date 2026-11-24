"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Video,
  X,
} from "lucide-react";

import { BoardTabs } from "@/components/board/board-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { easeOutSoft } from "@/components/motion/easing";
import { portalCard } from "@/components/portal/ui";
import {
  interviewConfig,
  type InterviewerKey,
  type InterviewWindow,
} from "@/content/interviews";
import {
  addDays,
  dayCells,
  dayParts,
  formatRange,
  formatTime,
  mondayOf,
  nyTime,
  placeOf,
  slotsFrom,
  zoned,
} from "@/lib/interviews";
import { cn } from "@/lib/utils";

export type WeekBooking = {
  applicantId: string;
  name: string;
  start: string;
  end: string;
  interviewer: InterviewerKey;
  location: string;
};

/** Solid for booked, a tint for free. Written out so Tailwind sees them. */
const TONES: Record<InterviewerKey, { solid: string; tint: string }> = {
  core: { solid: "bg-cta text-white", tint: "bg-cta/20 dark:bg-cta/25" },
};

const pill =
  "inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[14px] transition-colors hover:bg-muted";
const quiet = "text-[13px] text-subtle-foreground";

const label = (date: string, o: Intl.DateTimeFormatOptions) =>
  new Date(zoned(date, "12:00")).toLocaleDateString("en-US", {
    timeZone: interviewConfig.timeZone,
    ...o,
  });

/**
 * The board's Schedule tab: one week as a calendar. Free times are a
 * tint, booked conversations are solid with the student's name. Pick
 * "Edit times" and drag over the grid, when2meet
 * style, and save: students can book those times straight away.
 */
export function ScheduleView({
  week,
  today,
  windows,
  bookings,
  interviewers,
}: {
  week: string;
  today: string;
  windows: InterviewWindow[];
  bookings: WeekBooking[];
  interviewers: { key: InterviewerKey; name: string }[];
  canSignOut?: boolean;
}) {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const [now] = React.useState(() => Date.now());
  const [editing, setEditing] = React.useState<InterviewerKey | null>(null);
  const [draft, setDraft] = React.useState<Map<string, string>>(new Map());
  const [placeMode, setPlaceMode] = React.useState<"room" | "meet">("room");
  const [room, setRoom] = React.useState(interviewConfig.defaultRoom);
  const [meet, setMeet] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState<WeekBooking | null>(null);
  // A drag marks (or clears) the whole box from where it started to the pointer, like when2meet.
  const drag = React.useRef<{
    mode: "add" | "remove";
    anchor: { c: number; r: number };
    base: Map<string, string>;
  } | null>(null);

  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(week, i)),
    [week],
  );
  const columns = React.useMemo(() => days.map((d) => dayCells(d)), [days]);
  const rows = columns[0]?.length ?? 0;

  // What's free and what's booked, by "interviewer|start".
  const free = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of slotsFrom(windows))
      m.set(`${s.interviewer}|${s.start}`, s.location);
    return m;
  }, [windows]);
  const booked = React.useMemo(() => {
    const m = new Map<string, WeekBooking>();
    for (const b of bookings)
      m.set(`${b.interviewer}|${new Date(b.start).toISOString()}`, b);
    return m;
  }, [bookings]);

  const visible: InterviewerKey[] = interviewers.map((i) => i.key);
  const place =
    placeMode === "meet"
      ? meet.trim()
      : room.trim() || interviewConfig.defaultRoom;
  const canPaint = placeMode === "room" || /^https:\/\/\S+$/i.test(meet.trim());
  const isPast = (iso: string) => new Date(iso).getTime() <= now;

  function startEditing(k: InterviewerKey) {
    const m = new Map<string, string>();
    for (const [key, loc] of free)
      if (key.startsWith(`${k}|`)) m.set(key.slice(k.length + 1), loc);
    setDraft(m);
    setEditing(k);
    setError(null);
    setSaved(null);
  }

  const locked = (iso: string) =>
    isPast(iso) || (!!editing && booked.has(`${editing}|${iso}`));

  function paintTo(c: number, r: number) {
    const d = drag.current;
    if (!d) return;
    const next = new Map(d.base);
    const [c0, c1] = [Math.min(d.anchor.c, c), Math.max(d.anchor.c, c)];
    const [r0, r1] = [Math.min(d.anchor.r, r), Math.max(d.anchor.r, r)];
    for (let ci = c0; ci <= c1; ci++)
      for (let ri = r0; ri <= r1; ri++) {
        const iso = columns[ci]?.[ri];
        if (!iso || locked(iso)) continue;
        if (d.mode === "add") next.set(iso, d.base.get(iso) ?? place);
        else next.delete(iso);
      }
    setDraft(next);
  }

  function cellAt(x: number, y: number) {
    const el = (
      document.elementFromPoint(x, y) as HTMLElement | null
    )?.closest<HTMLElement>("[data-cell]");
    return el ? { c: Number(el.dataset.col), r: Number(el.dataset.row), iso: el.dataset.cell! } : null;
  }

  React.useEffect(() => {
    const stop = () => {
      drag.current = null;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/board/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interviewer: editing,
        week,
        cells: [...draft]
          .filter(([iso]) => !isPast(iso))
          .map(([start, location]) => ({ start, location })),
      }),
    }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    setSaving(false);
    if (!res?.ok)
      return setError(body?.error ?? "That didn't save. Try again.");
    setSaved(
      `Saved. ${body.open} open ${body.open === 1 ? "time" : "times"} this week, bookable now.`,
    );
    setEditing(null);
    router.refresh();
  }

  const shownBookings = bookings
    .filter((b) => visible.includes(b.interviewer))
    .sort((a, b) => a.start.localeCompare(b.start));
  const openCount = [...free.keys()].filter(
    (k) =>
      visible.includes(k.split("|")[0] as InterviewerKey) &&
      !booked.has(k) &&
      !isPast(k.split("|")[1]),
  ).length;
  const thisWeek = mondayOf(today);

  return (
    <main
      id="main"
      className={cn(
        "mx-auto w-full max-w-[1200px] px-4 pt-10 sm:px-8 sm:pt-12",
        editing ? "pb-48" : "pb-24",
      )}
    >
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-brand-deep">
            Board
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.9rem,1.4rem+1.8vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.03em]">
            Schedule
          </h1>
          <div className="mt-4">
            <BoardTabs active="schedule" />
          </div>
        </div>
      </div>

      {/* Week, and Edit */}
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/board/schedule?week=${addDays(week, -7)}`}
            aria-label="Previous week"
            className={cn(pill, "w-10 justify-center px-0")}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <p className="min-w-[150px] text-center font-display text-[18px] font-bold tracking-[-0.01em]">
            {label(week, { month: "short", day: "numeric" })} –{" "}
            {label(addDays(week, 6), { month: "short", day: "numeric" })}
          </p>
          <Link
            href={`/board/schedule?week=${addDays(week, 7)}`}
            aria-label="Next week"
            className={cn(pill, "w-10 justify-center px-0")}
          >
            <ChevronRight className="size-4" />
          </Link>
          {week !== thisWeek && (
            <Link
              href="/board/schedule"
              className="ml-1 text-[14px] text-brand-deep underline-offset-4 hover:underline"
            >
              This week
            </Link>
          )}
        </div>

        {!editing && (
          <Button variant="cta" className="h-10 self-start rounded-full px-4" onClick={() => startEditing(visible[0])}>
            <Pencil className="size-4" />
            Edit times
          </Button>
        )}
      </div>

      <p className="mt-4 text-[14px] text-muted-foreground">
        {editing ? (
          <>
            <span className="font-medium text-foreground">
              Drag over the times you&apos;re free.
            </span>{" "}
            Drag again to take them off. Booked and past times are locked.
          </>
        ) : (
          <>
            {shownBookings.length} booked · {openCount} open{" "}
            {openCount === 1 ? "time" : "times"} left this week
          </>
        )}
      </p>
      <AnimatePresence>
        {saved && !editing && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[14px] font-medium text-brand-deep"
            role="status"
          >
            {saved}
          </motion.p>
        )}
      </AnimatePresence>

      {/* The week */}
      <div className={cn(portalCard, "mt-5 overflow-hidden p-0")}>
        <div className="overflow-x-auto">
          <div
            className={cn(
              "grid min-w-[700px] select-none",
              editing && "touch-none",
            )}
            style={{ gridTemplateColumns: "56px repeat(7, minmax(88px, 1fr))" }}
            onPointerDown={(e) => {
              if (!editing || !canPaint) return;
              const cell = cellAt(e.clientX, e.clientY);
              if (!cell || locked(cell.iso)) return;
              (e.target as Element).releasePointerCapture?.(e.pointerId);
              drag.current = {
                mode: draft.has(cell.iso) ? "remove" : "add",
                anchor: { c: cell.c, r: cell.r },
                base: draft,
              };
              paintTo(cell.c, cell.r);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const cell = cellAt(e.clientX, e.clientY);
              if (cell) paintTo(cell.c, cell.r);
            }}
          >
            {/* Day headers */}
            <div className="sticky left-0 z-10 border-b border-border bg-card" />
            {days.map((d) => {
              const p = dayParts(new Date(zoned(d, "12:00")).toISOString());
              const isToday = d === today;
              const dayFrom = new Date(zoned(d, "00:00")).toISOString();
              const dayTo = new Date(
                zoned(addDays(d, 1), "00:00"),
              ).toISOString();
              const count = bookings.filter(
                (b) =>
                  visible.includes(b.interviewer) &&
                  b.start >= dayFrom &&
                  b.start < dayTo,
              ).length;
              return (
                <div
                  key={d}
                  className="flex flex-col items-center border-b border-l border-border px-1 py-2.5"
                >
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.08em]",
                      isToday ? "text-brand-deep" : "text-muted-foreground",
                    )}
                  >
                    {p.weekday}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 place-items-center rounded-full font-display text-[17px] font-bold",
                      isToday && "bg-cta text-white",
                    )}
                  >
                    {p.day}
                  </span>
                  <span className={cn(quiet, "mt-0.5 text-[11.5px]")}>
                    {count ? `${count} booked` : " "}
                  </span>
                </div>
              );
            })}

            {/* Rows */}
            {Array.from({ length: rows }, (_, r) => {
              const sample = columns[0][r];
              const t = nyTime(sample);
              const onHour = t.endsWith(":00");
              return (
                <React.Fragment key={r}>
                  <div
                    className={cn(
                      "sticky left-0 z-10 bg-card pr-2 text-right",
                      onHour && "border-t border-border",
                    )}
                  >
                    {onHour && (
                      <span className="relative -top-2 text-[11px] text-subtle-foreground">
                        {formatTime(sample).replace(":00", "")}
                      </span>
                    )}
                  </div>
                  {columns.map((cells, c) => {
                    const iso = cells[r];
                    const past = isPast(iso);
                    return (
                      <div
                        key={iso}
                        data-cell={iso}
                        data-col={c}
                        data-row={r}
                        className={cn(
                          "flex h-[22px] gap-px border-l border-border",
                          onHour ? "border-t" : "border-t border-t-border/40",
                          past && "bg-muted/50",
                          editing && !past && canPaint && "cursor-pointer",
                        )}
                        title={`${days[c]} ${formatTime(iso)}`}
                      >
                        {visible
                          .filter(
                            (k) =>
                              visible.length === 1 ||
                              booked.has(`${k}|${iso}`) ||
                              (editing === k
                                ? draft.has(iso)
                                : free.has(`${k}|${iso}`)),
                          )
                          .map((k) => {
                            const b = booked.get(`${k}|${iso}`);
                            const loc =
                              editing === k
                                ? draft.get(iso)
                                : free.get(`${k}|${iso}`);
                            if (b) {
                              return (
                                <button
                                  key={k}
                                  type="button"
                                  title={`${b.name} · ${formatRange(b)}`}
                                  disabled={!!editing}
                                  onClick={() => setOpen(b)}
                                  className={cn(
                                    "flex min-w-0 flex-1 items-center rounded-[5px] px-1.5 text-left text-[11px] font-medium outline-none transition-[filter] focus-visible:ring-2 focus-visible:ring-ring/60 enabled:hover:brightness-95",
                                    TONES[k].solid,
                                  )}
                                >
                                  <span className="truncate">{b.name}</span>
                                </button>
                              );
                            }
                            if (loc) {
                              return (
                                <span
                                  key={k}
                                  className={cn(
                                    "flex min-w-0 flex-1 items-center justify-end rounded-[4px] pr-1",
                                    TONES[k].tint,
                                    past && "opacity-50",
                                  )}
                                >
                                  {placeOf({ location: loc }).url && (
                                    <Video
                                      className="size-2.5 opacity-60"
                                      aria-label="Google Meet"
                                    />
                                  )}
                                </span>
                              );
                            }
                            return <span key={k} className="flex-1" />;
                          })}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className={cn("h-3 w-5 rounded-[4px]", TONES.core.tint)} aria-hidden="true" /> Free
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className={cn("h-3 w-5 rounded-[4px]", TONES.core.solid)} aria-hidden="true" /> Booked
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Video className="size-3" aria-hidden="true" /> Google Meet
        </span>
      </div>

      {/* The week as a list, easier on a phone */}
      {!editing && (
        <section aria-labelledby="week-list" className="mt-10">
          <h2
            id="week-list"
            className="text-[16px] font-medium tracking-[-0.01em]"
          >
            This week&apos;s conversations
          </h2>
          {shownBookings.length ? (
            <ol className={cn(portalCard, "mt-3 divide-y divide-border p-1.5")}>
              {shownBookings.map((b) => {
                const p = dayParts(b.start);
                return (
                  <li key={`${b.interviewer}${b.start}`}>
                    <button
                      type="button"
                      onClick={() => setOpen(b)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                    <span
                      className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-border py-1 leading-tight"
                      aria-hidden="true"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {p.weekday}
                      </span>
                      <span className="font-display text-[18px] font-bold">
                        {p.day}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">
                        {b.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
                        {formatRange(b)}
                        <span className="inline-flex items-center gap-1">
                          {placeOf(b).url ? (
                            <Video className="size-3" aria-hidden="true" />
                          ) : (
                            <MapPin className="size-3" aria-hidden="true" />
                          )}
                          {placeOf(b).label}
                        </span>
                      </span>
                    </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-2 text-[14px] text-muted-foreground">
              Nothing booked this week yet.
            </p>
          )}
        </section>
      )}

      {/* Editing bar */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: reduce ? 0 : 24,
              transition: { duration: 0.2 },
            }}
            transition={{ duration: 0.5, ease: easeOutSoft }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
          >
            <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-[14px] font-medium">New times are</span>
                <div
                  role="radiogroup"
                  aria-label="Where"
                  className="flex rounded-xl bg-muted p-1"
                >
                  {(
                    [
                      { key: "room", label: "In person", Icon: MapPin },
                      { key: "meet", label: "Google Meet", Icon: Video },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      role="radio"
                      aria-checked={placeMode === o.key}
                      onClick={() => setPlaceMode(o.key)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[14px] transition-colors",
                        placeMode === o.key
                          ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgb(var(--shadow-color)/0.12)] dark:bg-secondary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <o.Icon className="size-3.5" aria-hidden="true" />
                      {o.label}
                    </button>
                  ))}
                </div>
                {placeMode === "room" ? (
                  <Input
                    aria-label="Room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="h-10 sm:w-48"
                    placeholder="Room"
                  />
                ) : (
                  <Input
                    aria-label="Google Meet link"
                    value={meet}
                    onChange={(e) => setMeet(e.target.value)}
                    className="h-10 sm:w-72"
                    placeholder="https://meet.google.com/…"
                    inputMode="url"
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                <p role="alert" className="text-[13px] text-destructive">
                  {error ?? (!canPaint ? "Paste your Meet link first." : null)}
                </p>
                <Button
                  variant="ghost"
                  className="h-10 rounded-full px-4"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="cta"
                  className="h-10 rounded-full px-5"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  Save this week
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <BookingPanel
            key={open.applicantId}
            booking={open}
            onClose={() => setOpen(null)}
            onCancelled={(msg) => {
              setOpen(null);
              setSaved(msg);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/** One booked conversation: who, when, where, and cancelling it. */
function BookingPanel({
  booking,
  onClose,
  onCancelled,
}: {
  booking: WeekBooking;
  onClose: () => void;
  onCancelled: (message: string) => void;
}) {
  const reduce = !!useReducedMotion();
  const [note, setNote] = React.useState("");
  const [sure, setSure] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const over = new Date(booking.end).getTime() <= Date.now();
  const first = booking.name.trim().split(/\s+/)[0];

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function cancel() {
    if (!sure) return setSure(true);
    setBusy(true);
    setError(null);
    const res = await fetch("/api/board/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: booking.applicantId, note }),
    }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setError(body?.error ?? "That didn't go through. Try again.");
    onCancelled(
      body.emailed
        ? `Cancelled. We emailed ${first} to pick a new time.`
        : `Cancelled, and the time is open again. Email isn't set up yet, so message ${first} yourself to rebook.`,
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${booking.name}'s conversation`}
        initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduce ? 0 : 8 }}
        transition={{ duration: 0.35, ease: easeOutSoft }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] overflow-hidden rounded-[24px] bg-background shadow-[0_24px_64px_-24px_rgb(var(--shadow-color)/0.5)]"
      >
        <div className="relative bg-cta px-6 pb-5 pt-4 text-white">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              autoFocus
              className="-mr-2 grid size-9 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="size-[18px]" />
            </button>
          </div>
          <p className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em]">{booking.name}</p>
          <p className="mt-1 text-[14px] text-white/90">
            {dayParts(booking.start).weekday}, {dayParts(booking.start).month} {dayParts(booking.start).day} · {formatRange(booking)}
          </p>
          <p className="mt-0.5 text-[14px] text-white/80">{placeOf(booking).label}</p>
        </div>

        <div className="grid gap-3 p-6">
          {over ? (
            <p className="text-[14px] text-muted-foreground">This conversation has already happened.</p>
          ) : (
            <>
              <p className="text-[14px] text-muted-foreground">
                Cancelling frees this time and emails {first} to pick a new one, with their private link. You both get the calendar
                cancellation.
              </p>
              <label className="grid gap-1.5">
                <span className="text-[13px] font-medium">Note to {first} (optional)</span>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 600))}
                  placeholder="Sorry, something came up on our end."
                  rows={3}
                />
              </label>
              {error && (
                <p role="alert" className="text-[13px] text-destructive">
                  {error}
                </p>
              )}
              <div className="mt-1 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" className="h-10 rounded-full px-4" onClick={onClose} disabled={busy}>
                  Keep it
                </Button>
                <Button
                  className={cn(
                    "h-10 rounded-full px-4 font-semibold",
                    sure ? "bg-destructive text-white hover:bg-destructive/90" : "border border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10",
                  )}
                  onClick={cancel}
                  disabled={busy}
                >
                  {busy && <Loader2 className="animate-spin" />}
                  {sure ? "Yes, cancel it" : "Cancel and ask them to rebook"}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
