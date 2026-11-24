"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarPlus, Loader2, MapPin, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CoreBulb } from "@/components/brand/core-bulb";
import { Marker } from "@/components/hero/hand-drawn";
import { easeOutSoft } from "@/components/motion/easing";
import { portalCard, portalTitle } from "@/components/portal/ui";
import { interviewCopy } from "@/content/interviews";
import { dayParts, formatDay, formatRange, formatSlot, formatTime, placeOf, type Slot } from "@/lib/interviews";
import { cn } from "@/lib/utils";

/** Where it happens, with the right icon; a Meet link opens. */
function Place({ slot, className }: { slot: Slot; className?: string }) {
  const place = placeOf(slot);
  const Icon = place.url ? Video : MapPin;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {place.url ? (
        <a href={place.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
          {place.label}
        </a>
      ) : (
        place.label
      )}
    </span>
  );
}

/**
 * Pick a day → pick a time → confirm → booked. One interview per
 * student; picking a new time moves the booking. Once booked, the
 * time sits on a card styled like the CORE logo tile.
 */
export function InterviewBooker({
  open,
  booked,
  startPicking = false,
}: {
  open: Slot[];
  booked: Slot | null;
  /** Coming from "Change time": open straight on the times. */
  startPicking?: boolean;
}) {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const [mine, setMine] = React.useState<Slot | null>(booked);
  const [picking, setPicking] = React.useState(!booked || startPicking);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"book" | "cancel" | null>(null);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const days = React.useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of open) {
      if (s.id === mine?.id) continue;
      const d = formatDay(s.start);
      map.set(d, [...(map.get(d) ?? []), s]);
    }
    return [...map.entries()];
  }, [open, mine]);
  const [dayKey, setDayKey] = React.useState<string | null>(null);
  const day = days.find(([k]) => k === dayKey) ?? days[0] ?? null;
  const choice = open.find((s) => s.id === selected) ?? null;

  // From "Change time": bring the times into view under the current booking.
  React.useEffect(() => {
    if (!startPicking || !booked) return;
    const t = window.setTimeout(() => document.getElementById("times")?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
    return () => window.clearTimeout(t);
  }, [startPicking, booked]);

  async function book() {
    if (!choice) return;
    setBusy("book");
    setError(null);
    const res = await fetch("/api/portal/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: choice.id }),
    }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    setBusy(null);
    if (!res?.ok) {
      setError(body?.error ?? "That didn't go through. Try again.");
      router.refresh();
      return;
    }
    setMine(body.slot);
    setPicking(false);
    setSelected(null);
    router.refresh();
  }

  async function cancel() {
    if (!confirmCancel) return setConfirmCancel(true);
    setBusy("cancel");
    setError(null);
    const res = await fetch("/api/portal/interview", { method: "DELETE" }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    setBusy(null);
    setConfirmCancel(false);
    if (!res?.ok) return setError(body?.error ?? "That didn't go through. Try again.");
    setMine(null);
    setPicking(true);
    router.refresh();
  }

  const [intro, purpose, topics, prepare] = interviewCopy.expect;
  const booked_ = mine && !picking;

  return (
    <div className="w-full">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Portal
      </Link>

      <h1 key={booked_ ? "booked" : "pick"} className={cn(portalTitle, "isolate mt-6")}>
        {booked_ ? (
          <>
            You&apos;re <Marker delay={0.3}>booked</Marker>.
          </>
        ) : (
          <>
            Pick a time to <Marker delay={0.4}>talk</Marker>.
          </>
        )}
      </h1>

      <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-foreground/85">
        {intro} {purpose}
      </p>
      <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-muted-foreground">
        {topics} {prepare}
      </p>

      {mine && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: easeOutSoft }}
          className="relative mt-9 overflow-hidden rounded-[24px] bg-cta text-white shadow-[0_24px_48px_-24px_rgb(var(--shadow-color)/0.45)]"
          aria-label="Your conversation"
        >
          <CoreBulb lightUp className="pointer-events-none absolute -right-3 -top-4 h-40 w-auto text-white/15 sm:right-6 sm:h-44" />
          <div className="relative p-6 pb-5 sm:p-7 sm:pb-6">
            <p className="font-display text-[14px] font-bold tracking-[-0.01em] text-white/85">CORE Fellowship</p>
            <p className="mt-5 text-[14px] text-white/80">{formatDay(mine.start)}</p>
            <p className="mt-0.5 font-display text-[clamp(1.6rem,1.3rem+1.4vw,2.1rem)] font-bold leading-tight tracking-[-0.02em]">
              {formatRange(mine)}
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-white/90">
              <Place slot={mine} />
              <span aria-hidden="true" className="text-white/50">·</span>
              <span>{interviewCopy.length}</span>
            </p>
          </div>
          {/* Ticket tear line */}
          <div aria-hidden="true" className="relative mx-6 border-t border-dashed border-white/35 sm:mx-7" />
          <div className="relative flex flex-wrap items-center gap-2 p-4 sm:px-7">
            <a
              href="/api/portal/interview/ics"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13.5px] font-medium text-[#1d4f99] transition-colors hover:bg-white/90"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add to calendar
            </a>
            {!picking && (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="inline-flex h-9 items-center rounded-full border border-white/45 px-3.5 text-[13.5px] font-medium transition-colors hover:bg-white/10"
              >
                Change time
              </button>
            )}
            <button
              type="button"
              onClick={cancel}
              disabled={busy === "cancel"}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              {busy === "cancel" && <Loader2 className="size-4 animate-spin" />}
              {confirmCancel ? "Tap again to cancel" : "Cancel"}
            </button>
          </div>
        </motion.section>
      )}

      <AnimatePresence initial={false}>
        {picking && (
          <motion.section
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.7, ease: easeOutSoft }}
            id="times"
            className={cn(portalCard, "mt-9 scroll-mt-24 p-2")}
            aria-label="Available times"
          >
            {mine && <h2 className="px-3 pb-1 pt-3 text-[16px] font-medium tracking-[-0.01em]">Pick a new time</h2>}
            {!day ? (
              <div className="p-8 text-center text-[15px] text-muted-foreground">
                No open times right now. New ones get added every week, so check back soon.
              </div>
            ) : (
              <>
                <div
                  role="radiogroup"
                  aria-label="Day"
                  className="flex gap-2 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {days.map(([key, slots]) => {
                    const on = key === day[0];
                    const parts = dayParts(slots[0].start);
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${key}, ${slots.length} open`}
                        onClick={() => {
                          setDayKey(key);
                          setSelected(null);
                          setError(null);
                        }}
                        className={cn(
                          "flex w-[74px] shrink-0 flex-col items-center rounded-2xl border px-2 pb-2.5 pt-2 outline-none transition-[background-color,border-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          on ? "border-cta bg-cta text-cta-foreground" : "border-border hover:border-cta/50 hover:bg-columbia-soft/60"
                        )}
                      >
                        <span className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", on ? "text-white/85" : "text-muted-foreground")}>
                          {parts.weekday}
                        </span>
                        <span className="font-display text-[24px] font-bold leading-tight">{parts.day}</span>
                        <span className={cn("text-[12px]", on ? "text-white/85" : "text-muted-foreground")}>{parts.month}</span>
                        <span className={cn("mt-1.5 text-[11px]", on ? "text-white/80" : "text-subtle-foreground")}>{slots.length} open</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={day[0]}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.45, ease: easeOutSoft }}
                    className="px-3 pb-3 pt-2"
                  >
                    <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
                      <span className="font-medium">{day[0]}</span>
                      <Place slot={day[1][0]} className="text-muted-foreground" />
                    </p>
                    <div role="radiogroup" aria-label={`Times on ${day[0]}`} className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {day[1].map((s) => {
                        const on = selected === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => {
                              setSelected(on ? null : s.id);
                              setError(null);
                            }}
                            className={cn(
                              "h-11 rounded-xl border text-[14px] outline-none transition-[background-color,border-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                              on
                                ? "border-cta bg-cta font-semibold text-cta-foreground"
                                : "border-input text-foreground hover:border-cta/50 hover:bg-columbia-soft/60"
                            )}
                          >
                            {formatTime(s.start)}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <p role="alert" className="mt-4 min-h-5 text-[13px] text-destructive">
        {error}
      </p>

      <AnimatePresence>
        {picking && choice && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 24, transition: { duration: 0.2 } }}
            transition={{ duration: 0.55, ease: easeOutSoft }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
          >
            <div className="mx-auto flex max-w-[680px] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14px]">
                <span className="text-muted-foreground">{mine ? "Move to " : ""}</span>
                <span className="font-medium">{formatSlot(choice)}</span>
              </p>
              <Button variant="cta" size="lg" className="h-11 rounded-xl px-6" onClick={book} disabled={busy === "book"}>
                {busy === "book" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Booking
                  </>
                ) : mine ? (
                  "Move my conversation"
                ) : (
                  "Book this time"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
