import { bookingFor, currentStudent } from "@/lib/server/portal";
import { inviteIcs } from "@/lib/server/invites";

export const runtime = "nodejs";

/** Calendar file for the student's booked interview. */
export async function GET() {
  const me = await currentStudent();
  const slot = me ? await bookingFor(me.id) : null;
  if (!slot) return new Response("No interview booked.", { status: 404 });
  const ics = inviteIcs(me!, slot, "PUBLISH", []);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="core-fellowship-interview.ics"',
    },
  });
}
