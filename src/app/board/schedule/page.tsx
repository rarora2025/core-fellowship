import type { Metadata } from "next";

import { ScheduleView, type WeekBooking } from "@/components/board/schedule-view";
import { interviewers, type InterviewerKey } from "@/content/interviews";
import { addDays, mondayOf, nyDate, zoned } from "@/lib/interviews";
import { loadApplicants, onBoard } from "@/lib/server/board";
import { store } from "@/lib/server/store";

export const metadata: Metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  // The layout shows the sign-in; this is a second check.
  if (!(await onBoard())) return null;
  const { week: asked } = await searchParams;
  const now = new Date().toISOString();
  const today = nyDate(now);
  const [windows, applicants] = await Promise.all([store.windows(), loadApplicants()]);

  // With no week asked for, open on the first week from now that has
  // anything in it (times or bookings), rather than an empty one.
  const upcoming = [
    ...windows.map((w) => w.end),
    ...applicants.flatMap((a) => (a.booking ? [a.booking.end] : [])),
  ]
    .filter((end) => end > now)
    .sort();
  const firstBusy = upcoming.length ? nyDate(upcoming[0]) : today;
  const week = mondayOf(asked && DATE.test(asked) ? asked : firstBusy > today ? firstBusy : today);
  const from = new Date(zoned(week, "00:00")).toISOString();
  const to = new Date(zoned(addDays(week, 7), "00:00")).toISOString();
  const bookings: WeekBooking[] = applicants
    .filter((a) => a.booking && a.booking.start >= from && a.booking.start < to)
    .map((a) => ({
      applicantId: a.id,
      name: a.name || a.email,
      start: a.booking!.start,
      end: a.booking!.end,
      interviewer: a.booking!.interviewer,
      location: a.booking!.location,
    }));

  return (
    <>
      <ScheduleView
        week={week}
        today={today}
        windows={windows.filter((w) => w.start >= from && w.start < to)}
        bookings={bookings}
        interviewers={(Object.keys(interviewers) as InterviewerKey[]).map((key) => ({ key, name: interviewers[key].name }))}
      />
    </>
  );
}
