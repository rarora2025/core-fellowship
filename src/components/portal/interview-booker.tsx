"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarPlus, Check, Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { easeOutSoft } from "@/components/motion/easing";
import { portalCard, portalTitle } from "@/components/portal/ui";
import { interviewCopy } from "@/content/interviews";
import { formatDay, formatSlot, formatTime, type Slot } from "@/lib/interviews";
import { cn } from "@/lib/utils";

/**
 * Pick a time → confirm → booked. One interview per student;
 * picking a new time moves the booking.
 */
export function InterviewBooker({ open, booked }: { open: Slot[]; booked: Slot | null }) {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const [mine, setMine] = React.useState<Slot | null>(booked);
  const [picking, setPicking] = React.useState(!booked);
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
  const choice = open.find((s) => s.id === selected) ?? null;

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

  return (
    <div className="w-full">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Portal
      </Link>

      <h1 className={cn(portalTitle, "mt-6")}>{mine && !picking ? "You're booked." : "Pick a time to talk."}</h1>

      <ul className="mt-4 max-w-lg space-y-1.5 text-[15px] leading-relaxed text-muted-foreground">
        {interviewCopy.expect.map((line) => (
          <li key={line} className="flex gap-2.5">
            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-columbia" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      {mine && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutSoft }}
          className={cn(portalCard, "mt-8 p-5 sm:p-6")}
          aria-label="Your interview"
        >
          <div className="flex items-start gap-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cta text-cta-foreground">
              <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-medium tracking-[-0.01em]">{formatSlot(mine)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden="true" />
                {mine.location} · {interviewCopy.length}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 pl-0 sm:pl-[50px]">
            <Button asChild variant="outline" size="sm">
              <a href="/api/portal/interview/ics">
                <CalendarPlus />
                Add to calendar
              </a>
            </Button>
            {!picking && (
              <Button variant="outline" size="sm" onClick={() => setPicking(true)}>
                Change time
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={cancel} disabled={busy === "cancel"}>
              {busy === "cancel" ? <Loader2 className="animate-spin" /> : null}
              {confirmCancel ? "Tap again to cancel" : "Cancel"}
            </Button>
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
            className="mt-10"
            aria-label="Available times"
          >
            {mine && <h2 className="mb-4 text-[17px] font-medium tracking-[-0.01em]">Pick a new time</h2>}
            {days.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-input p-8 text-center text-[15px] text-muted-foreground">
                No open times right now. New ones get added every week, so check back soon.
              </div>
            ) : (
              <div className="space-y-7">
                {days.map(([day, slots], d) => (
                  <motion.div
                    key={day}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: easeOutSoft, delay: 0.1 + d * 0.05 }}
                  >
                    <h3 className="text-[14px] font-medium">
                      {day}
                      <span className="ml-2 font-normal text-subtle-foreground">{slots[0].location}</span>
                    </h3>
                    <div role="radiogroup" aria-label={day} className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {slots.map((s) => {
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
                              "h-11 rounded-xl border text-[14px] tabular-nums outline-none transition-[background-color,border-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                              on
                                ? "border-cta bg-cta font-medium text-cta-foreground"
                                : "border-input text-foreground hover:border-columbia hover:bg-columbia-soft/60"
                            )}
                          >
                            {formatTime(s.start)}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
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
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl"
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
                  "Move my interview"
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
