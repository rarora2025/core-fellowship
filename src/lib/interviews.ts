/**
 * Interview slots, generated from the windows in content/interviews.
 * Pure functions, so the server and the browser agree on ids and times.
 */
import { interviewConfig, interviewWindows, type InterviewWindow } from "@/content/interviews";

export type Slot = {
  /** Stable id: start time in UTC, e.g. 2026-12-01T19:00Z */
  id: string;
  start: string; // ISO
  end: string; // ISO
  location: string;
};

/** Offset in ms between UTC and `timeZone` at a given instant. */
function tzOffset(at: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - at;
}

/** "2026-12-01" + "14:00" in the configured zone → UTC ms. */
function zoned(date: string, time: string, timeZone = interviewConfig.timeZone) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - tzOffset(guess, timeZone);
  return guess - tzOffset(first, timeZone);
}

function slotsFor(w: InterviewWindow): Slot[] {
  const step = interviewConfig.slotMinutes * 60_000;
  const end = zoned(w.date, w.end);
  const out: Slot[] = [];
  for (let t = zoned(w.date, w.start); t + step <= end; t += step) {
    const iso = new Date(t).toISOString();
    out.push({ id: iso.slice(0, 16) + "Z", start: iso, end: new Date(t + step).toISOString(), location: w.location });
  }
  return out;
}

export function allSlots(): Slot[] {
  return interviewWindows.flatMap(slotsFor).sort((a, b) => a.start.localeCompare(b.start));
}

export function findSlot(id: string) {
  return allSlots().find((s) => s.id === id) ?? null;
}

/** A slot can be booked or changed until `lockHours` before it starts. */
export function isOpen(slot: Slot, now = Date.now()) {
  return new Date(slot.start).getTime() - now > interviewConfig.lockHours * 3_600_000;
}

const tz = { timeZone: interviewConfig.timeZone };

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { ...tz, weekday: "long", month: "long", day: "numeric" });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { ...tz, hour: "numeric", minute: "2-digit" });
}

export function formatSlot(s: Slot) {
  return `${formatDay(s.start)}, ${formatTime(s.start)} – ${formatTime(s.end)} ET`;
}
