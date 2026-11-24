import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InterviewBooker } from "@/components/portal/interview-booker";
import { allSlots, isOpen } from "@/lib/interviews";
import { bookingFor, currentStudent, takenSlotIds } from "@/lib/server/portal";

export const metadata: Metadata = { title: "Book your conversation" };
export const dynamic = "force-dynamic";

export default async function InterviewPage() {
  const me = await currentStudent();
  if (!me) redirect("/portal");
  const [taken, booked] = await Promise.all([takenSlotIds(), bookingFor(me.id)]);
  const open = allSlots().filter((s) => isOpen(s) && !taken.includes(s.id));
  return (
    <main id="main" className="mx-auto w-full max-w-[680px] px-5 pb-40 pt-10 sm:pt-14">
      <InterviewBooker open={open} booked={booked} />
    </main>
  );
}
