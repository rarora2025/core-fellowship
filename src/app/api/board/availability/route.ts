import { NextResponse } from "next/server";

import { interviewConfig, interviewers, type InterviewerKey } from "@/content/interviews";
import { addDays, blocksFrom, dayCells, formatShortDay, formatTime, nyDate, SLOT_MS, slotsFrom, zoned } from "@/lib/interviews";
import { onBoard } from "@/lib/server/board";
import { store } from "@/lib/server/store";

export const runtime = "nodejs";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Saves one interviewer's free times for one week, from the board's
 * Schedule tab. Body: { interviewer, week: "YYYY-MM-DD" (a Monday), cells:
 * [{ start: ISO, location }] }, one cell per 20 minutes they're free.
 *
 * Times that have started are kept as they were, whatever is sent; a
 * time a student has booked can't be taken away.
 */
export async function PUT(request: Request) {
  if (!(await onBoard())) return NextResponse.json({ ok: false, error: "Sign in to the board first." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { interviewer?: unknown; week?: unknown; cells?: unknown };
  const interviewer = body.interviewer as InterviewerKey;
  if (typeof interviewer !== "string" || !(interviewer in interviewers)) {
    return NextResponse.json({ ok: false, error: "Pick whose times these are." }, { status: 400 });
  }
  if (typeof body.week !== "string" || !DATE.test(body.week) || !Array.isArray(body.cells) || body.cells.length > 7 * 60) {
    return NextResponse.json({ ok: false, error: "That week didn't come through. Reload and try again." }, { status: 400 });
  }
  const week = body.week;
  const from = new Date(zoned(week, "00:00")).toISOString();
  const to = new Date(zoned(addDays(week, 7), "00:00")).toISOString();
  const now = Date.now();

  // Only real grid cells inside this week, in the future.
  const allowed = new Set(Array.from({ length: 7 }, (_, i) => dayCells(addDays(week, i))).flat());
  const sent = new Map<string, string>();
  for (const c of body.cells as { start?: unknown; location?: unknown }[]) {
    if (typeof c?.start !== "string") continue;
    const start = new Date(c.start);
    if (Number.isNaN(start.getTime())) continue;
    const iso = start.toISOString();
    if (!allowed.has(iso) || start.getTime() <= now) continue;
    const location = typeof c.location === "string" && c.location.trim() ? c.location.trim().slice(0, 300) : interviewConfig.defaultRoom;
    if (/^https?:\/\//i.test(location) && !/^https:\/\/[^\s]+$/i.test(location)) {
      return NextResponse.json({ ok: false, error: "That Meet link doesn't look right. Paste the whole https:// link." }, { status: 400 });
    }
    sent.set(iso, location);
  }

  // Keep what has already started exactly as it was.
  const existing = slotsFrom((await store.windows()).filter((w) => w.interviewer === interviewer && w.start >= from && w.start < to));
  for (const s of existing) if (new Date(s.start).getTime() <= now) sent.set(s.start, s.location);

  // Never take away a booked time.
  const bookings = await store.bookings();
  for (const id of Object.keys(bookings)) {
    if (!id.endsWith(`-${interviewer}`)) continue;
    const start = `${id.slice(0, 16)}:00.000Z`;
    if (start < from || start >= to || new Date(start).getTime() <= now) continue;
    if (!sent.has(start)) {
      return NextResponse.json(
        { ok: false, error: `Someone is booked ${formatShortDay(start)} at ${formatTime(start)}. That time has to stay open.` },
        { status: 409 }
      );
    }
  }

  const blocks = blocksFrom([...sent].map(([start, location]) => ({ start, location })), interviewer);
  // A stray cell outside the grid can't sneak in: every block starts on a grid cell.
  if (blocks.some((b) => !allowed.has(b.start) && new Date(b.start).getTime() > now)) {
    return NextResponse.json({ ok: false, error: "Those times didn't line up. Reload and try again." }, { status: 400 });
  }
  await store.replaceWindows(interviewer, from, to, blocks);
  const open = blocks.reduce((n, b) => n + Math.round((new Date(b.end).getTime() - new Date(b.start).getTime()) / SLOT_MS), 0);
  return NextResponse.json({ ok: true, open, week: nyDate(from) });
}
