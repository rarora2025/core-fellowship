import { environmentPairs } from "@/content/profile";
import { formatSlot } from "@/lib/interviews";
import { loadApplicants, onBoard } from "@/lib/server/board";

export const runtime = "nodejs";

// Quote every cell, and stop spreadsheet apps from running anything typed as a formula.
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

/** Everyone as a CSV, for a spreadsheet or to send to a startup. */
export async function GET() {
  if (!(await onBoard())) return new Response("Sign in to the board first.", { status: 401 });
  const people = await loadApplicants();
  const header = [
    "Name", "Email", "Grad year", "Major", "Where", "Work authorization", "Describes self as", "Fluent in",
    "Wants to do", "Spaces", "Into outside class", "How they like to work", "Company size", "LinkedIn", "Work link",
    "Interview", "Interviewer", "Applied",
  ];
  const rows = people.map((p) => [
    p.name, p.email, p.gradYear, p.major, p.profile.location.join("; "), p.profile.workAuth.join(""),
    p.profile.builderTypes.join("; "), p.profile.skills.join("; "), p.profile.roles.join("; "), p.profile.interests.join("; "),
    p.profile.fascinations.join("; "),
    environmentPairs
      .map(({ key, left, right }) => {
        const c = p.profile.environment[key];
        return c === "left" ? left : c === "right" ? right : c === "either" ? `${left} or ${right}` : "";
      })
      .filter(Boolean)
      .join("; "),
    p.profile.companySize.join("; "), p.linkedin, p.workLink,
    p.booking ? formatSlot(p.booking) : "", p.booking?.interviewerName ?? "", p.receivedAt.slice(0, 10),
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="core-fellowship-applicants.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
