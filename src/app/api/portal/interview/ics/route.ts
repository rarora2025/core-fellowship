import { bookingFor, currentStudent } from "@/lib/server/portal";
import { siteConfig } from "@/content/site";

export const runtime = "nodejs";

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Calendar file for the student's booked interview. */
export async function GET() {
  const me = await currentStudent();
  const slot = me ? await bookingFor(me.id) : null;
  if (!slot) return new Response("No interview booked.", { status: 404 });
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CORE Fellowship//Interview//EN",
    "BEGIN:VEVENT",
    `UID:${slot.id}-${me!.id}@corefellowship`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(slot.start)}`,
    `DTEND:${stamp(slot.end)}`,
    `SUMMARY:${siteConfig.name} conversation`,
    `LOCATION:${slot.location}`,
    "DESCRIPTION:A relaxed 20-minute conversation with CORE. Nothing to prepare.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="core-fellowship-interview.ics"',
    },
  });
}
