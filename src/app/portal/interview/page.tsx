import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InterviewBooker } from "@/components/portal/interview-booker";
import { isOpen } from "@/lib/interviews";
import { bookingFor, currentStudent, loadSlots, takenSlotIds } from "@/lib/server/portal";

export const metadata: Metadata = { title: "Book your conversation" };
export const dynamic = "force-dynamic";

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ change?: string }> }) {
  const me = await currentStudent();
  if (!me) redirect("/portal");
  const slots = await loadSlots();
  const [taken, booked, { change }] = await Promise.all([takenSlotIds(), bookingFor(me.id, slots), searchParams]);
  // When two interviewers are free at the same time, show that time once:
  // the student picks a time, not a person.
  const seen = new Set<string>();
  const open = slots.filter((s) => {
    if (!isOpen(s) || taken.includes(s.id) || seen.has(s.start)) return false;
    seen.add(s.start);
    return true;
  });
  return (
    <main id="main" className="mx-auto w-full max-w-[680px] px-5 pb-40 pt-10 sm:pt-14">
      <InterviewBooker open={open} booked={booked} startPicking={change === "1"} />
    </main>
  );
}
