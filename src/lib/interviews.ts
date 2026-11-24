/**
 * Interview slots, cut from the free blocks kept in the database.
 * Pure functions, so the server and the browser agree on ids and times.
 */
import { interviewConfig, interviewers, type InterviewerKey, type InterviewWindow } from "@/content/interviews";

export type Slot = {
  /** Stable id: start time in UTC and who interviews, e.g. 2026-12-01T19:00Z-dev */
  id: string;
  start: string; // ISO
  end: string; // ISO
  location: string;
  interviewer: InterviewerKey;
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
export function zoned(date: string, time: string, timeZone = interviewConfig.timeZone) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - tzOffset(guess, timeZone);
  return guess - tzOffset(first, timeZone);
}

export const SLOT_MS = interviewConfig.slotMinutes * 60_000;

export function slotId(startIso: string, interviewer: InterviewerKey) {
  return `${new Date(startIso).toISOString().slice(0, 16)}Z-${interviewer}`;
}

function slotsFor(w: InterviewWindow): Slot[] {
  const end = new Date(w.end).getTime();
  const out: Slot[] = [];
  for (let t = new Date(w.start).getTime(); t + SLOT_MS <= end; t += SLOT_MS) {
    const iso = new Date(t).toISOString();
    out.push({ id: slotId(iso, w.interviewer), start: iso, end: new Date(t + SLOT_MS).toISOString(), location: w.location, interviewer: w.interviewer });
  }
  return out;
}

/** Every bookable slot in these free blocks, earliest first. */
export function slotsFrom(windows: InterviewWindow[]): Slot[] {
  return windows.flatMap(slotsFor).sort((a, b) => a.start.localeCompare(b.start) || a.interviewer.localeCompare(b.interviewer));
}

/* ---------- New York calendar arithmetic (for the Schedule grid) ---------- */

const ny = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: interviewConfig.timeZone, ...o }).format(new Date(iso));

/** "2026-12-01" for the New York day an instant falls on. */
export function nyDate(iso: string) {
  return ny(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** "14:20" in New York. */
export function nyTime(iso: string) {
  return ny(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** The Monday of the week a date is in. */
export function mondayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dow + 6) % 7));
}

/** Every slot start on one New York day between dayStart and dayEnd, as ISO. */
export function dayCells(date: string) {
  const out: string[] = [];
  const end = zoned(date, interviewConfig.dayEnd);
  for (let t = zoned(date, interviewConfig.dayStart); t + SLOT_MS <= end; t += SLOT_MS) out.push(new Date(t).toISOString());
  return out;
}

/** Back-to-back cells (ISO starts) with the same place become free blocks. */
export function blocksFrom(cells: { start: string; location: string }[], interviewer: InterviewerKey): InterviewWindow[] {
  const sorted = [...cells].sort((a, b) => a.start.localeCompare(b.start));
  const out: InterviewWindow[] = [];
  for (const c of sorted) {
    const startMs = new Date(c.start).getTime();
    const last = out[out.length - 1];
    if (last && new Date(last.end).getTime() === startMs && last.location === c.location) {
      last.end = new Date(startMs + SLOT_MS).toISOString();
    } else {
      out.push({ interviewer, start: new Date(startMs).toISOString(), end: new Date(startMs + SLOT_MS).toISOString(), location: c.location });
    }
  }
  return out;
}

/** Where a time happens: a room, or a Google Meet link shown as "Google Meet". */
export function placeOf(slot: Pick<Slot, "location">) {
  const online = /^https?:\/\//i.test(slot.location);
  return { label: online ? "Google Meet" : slot.location, url: online ? slot.location : null };
}

export function interviewerOf(slot: Slot) {
  return interviewers[slot.interviewer];
}

export function findIn(slots: Slot[], id: string) {
  return slots.find((s) => s.id === id) ?? null;
}

/** A slot can be booked or changed until `lockHours` before it starts. */
export function isOpen(slot: Slot, now = Date.now()) {
  return new Date(slot.start).getTime() - now > interviewConfig.lockHours * 3_600_000;
}

const tz = { timeZone: interviewConfig.timeZone };

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { ...tz, weekday: "long", month: "long", day: "numeric" });
}

/** The pieces of a day tile: { weekday: "Tue", day: "1", month: "Dec" }. */
export function dayParts(iso: string) {
  const d = new Date(iso);
  const part = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { ...tz, ...o });
  return { weekday: part({ weekday: "short" }), day: part({ day: "numeric" }), month: part({ month: "short" }) };
}

/** "6:00 – 6:20 PM ET" */
export function formatRange(s: Pick<Slot, "start" | "end">) {
  const a = formatTime(s.start);
  const b = formatTime(s.end);
  return `${a.slice(-2) === b.slice(-2) ? a.slice(0, -3) : a} – ${b} ET`;
}

/** "Wed, Dec 2" */
export function formatShortDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { ...tz, weekday: "short", month: "short", day: "numeric" });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { ...tz, hour: "numeric", minute: "2-digit" });
}

export function formatSlot(s: Slot) {
  return `${formatDay(s.start)}, ${formatTime(s.start)} – ${formatTime(s.end)} ET`;
}
