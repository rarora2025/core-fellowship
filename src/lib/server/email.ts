import "server-only";

import nodemailer from "nodemailer";

/**
 * Sends email through Resend's SMTP server (https://resend.com), the
 * same way LionApps does. SMTP rather than Resend's web API lets a
 * calendar invite ride inside the email as text/calendar, which is what
 * makes Gmail show the Yes / No / Maybe card and add it to the calendar.
 *
 * Needs RESEND_API_KEY (and MAIL_FROM, an address on a domain verified
 * in Resend) in .env.local or Vercel. Without them, emails are skipped
 * quietly so booking still works.
 */
export type Mail = {
  to: string;
  subject: string;
  text: string;
  calendar?: { method: "REQUEST" | "CANCEL"; content: string };
};

export async function sendEmails(mails: Mail[]) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    if (mails.length) console.log("Email skipped (RESEND_API_KEY or MAIL_FROM not set):", mails.map((m) => m.to).join(", "));
    return { sent: 0, skipped: true, error: "" };
  }
  // One pooled connection, kept under Resend's free-plan limit of 2 emails a second.
  const smtp = nodemailer.createTransport({
    pool: true,
    maxConnections: 1,
    rateDelta: 1000,
    rateLimit: 2,
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: { user: "resend", pass: key },
  });
  let firstError = "";
  const results = await Promise.all(
    mails.map(async (m) => {
      try {
        await smtp.sendMail({
          from,
          to: m.to,
          subject: m.subject,
          text: m.text,
          ...(m.calendar && {
            icalEvent: { method: m.calendar.method, filename: "invite.ics", content: m.calendar.content },
          }),
        });
        return true;
      } catch (e) {
        // Email trouble should never stop a booking from going through.
        console.error("Email failed", m.to, e);
        firstError ||= e instanceof Error ? e.message : String(e);
        return false;
      }
    })
  );
  smtp.close();
  return { sent: results.filter(Boolean).length, skipped: false, error: firstError };
}
