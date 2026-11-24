import "server-only";

import { siteConfig } from "@/content/site";
import { formatSlot, interviewerOf, placeOf, type Slot } from "@/lib/interviews";
import { sendEmails, type Mail } from "@/lib/server/email";

/**
 * Calendar invites for interviews, built like LionApps': when a student
 * books, moves or cancels, they and the interviewer on that time get an
 * email with an invite. One event per student (same UID), so a move
 * updates the event already on their calendar instead of adding another.
 */
export type Attendee = { id: string; name: string; email: string; token?: string };

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// ICS text escapes commas, semicolons and backslashes; long lines are folded.
const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");

export function inviteIcs(student: Attendee, slot: Slot, method: "REQUEST" | "CANCEL" | "PUBLISH", attendees: string[]) {
  const host = interviewerOf(slot);
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//CORE Fellowship//Interviews//EN",
    "VERSION:2.0",
    `METHOD:${method}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${student.id}@corefellowship`,
    `SEQUENCE:${Math.floor(Date.now() / 1000)}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(slot.start)}`,
    `DTEND:${stamp(slot.end)}`,
    `SUMMARY:${esc(`${siteConfig.name}: ${student.name || student.email} and ${host.name}`)}`,
    `DESCRIPTION:${esc(`A 20-minute conversation with CORE. No case, no test.${placeOf(slot).url ? `\nJoin: ${placeOf(slot).url}` : ""}`)}`,
    `LOCATION:${esc(slot.location)}`,
    ...(host.email ? [`ORGANIZER;CN=${esc(host.name)}:mailto:${host.email}`] : []),
    ...attendees.map((a) => `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a}`),
    `STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

function mails(student: Attendee, slot: Slot, method: "REQUEST" | "CANCEL", to: string[]): Mail[] {
  const host = interviewerOf(slot);
  const everyone = [student.email, host.email].filter(Boolean);
  const file = inviteIcs(student, slot, method, everyone);
  const when = formatSlot(slot);
  return to.filter(Boolean).map((addr) => {
    const forStudent = addr.toLowerCase() === student.email.toLowerCase();
    const who = forStudent ? host.name : student.name || student.email;
    const text =
      method === "CANCEL"
        ? `Your ${siteConfig.name} conversation with ${who} on ${when} is off. It's been taken off your calendar.`
        : `${siteConfig.name} conversation with ${who}\n${when}\n` +
          (placeOf(slot).url ? `Google Meet: ${placeOf(slot).url}\n\n` : `Where: ${slot.location}\n\n`) +
          `The invite is attached, and Google Calendar adds it automatically.` +
          (forStudent && student.token
            ? `\n\nTo change or cancel, use your private link (keep it to yourself):\n${siteConfig.url}/portal/enter?key=${student.token}`
            : "");
    return {
      to: addr,
      subject: method === "CANCEL" ? `Cancelled: ${siteConfig.name} conversation, ${when}` : `${siteConfig.name} conversation: ${when}`,
      text,
      calendar: { method, content: file },
    };
  });
}

/**
 * Tell everyone about a change. `before` is the time they held (if any),
 * `after` the time they hold now (if any). The student always hears;
 * an interviewer who's no longer on it gets a cancellation.
 */
export async function sendBookingInvites(student: Attendee, before: Slot | null, after: Slot | null) {
  const out: Mail[] = [];
  if (after) {
    out.push(...mails(student, after, "REQUEST", [student.email, interviewerOf(after).email]));
    if (before && before.interviewer !== after.interviewer) {
      out.push(...mails(student, before, "CANCEL", [interviewerOf(before).email]));
    }
  } else if (before) {
    out.push(...mails(student, before, "CANCEL", [student.email, interviewerOf(before).email]));
  }
  return sendEmails(out);
}
