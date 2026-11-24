import type { Metadata } from "next";

import { BoardSignIn } from "@/components/board/board-sign-in";
import { ScheduleView, type WeekBooking } from "@/components/board/schedule-view";
import { PortalHeader } from "@/components/portal/portal-header";
import { interviewers, type InterviewerKey } from "@/content/interviews";
import { addDays, mondayOf, nyDate, zoned } from "@/lib/interviews";
import { boardConfigured, developerAccess, loadApplicants, onBoard } from "@/lib/server/board";
import { store } from "@/lib/server/store";

export const metadata: Metadata = { title: "Schedule", robots: { index: false } };
export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  if (!(await onBoard())) {
    return (
      <>
        <PortalHeader board />
        <BoardSignIn configured={boardConfigured()} />
      </>
    );
  }
  const { week: asked } = await searchParams;
  const today = nyDate(new Date().toISOString());
  const week = mondayOf(asked && DATE.test(asked) ? asked : today);
  const from = new Date(zoned(week, "00:00")).toISOString();
  const to = new Date(zoned(addDays(week, 7), "00:00")).toISOString();

  const [windows, applicants] = await Promise.all([store.windows(), loadApplicants()]);
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
      <PortalHeader board />
      <ScheduleView
        week={week}
        today={today}
        windows={windows.filter((w) => w.start >= from && w.start < to)}
        bookings={bookings}
        interviewers={(Object.keys(interviewers) as InterviewerKey[]).map((key) => ({ key, name: interviewers[key].name }))}
        canSignOut={!(await developerAccess())}
      />
    </>
  );
}
