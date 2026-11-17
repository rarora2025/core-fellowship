import { NextResponse } from "next/server";

import {
  emptyStudentApplication,
  validateStudentApplication,
  type StudentApplication,
} from "@/lib/applications/student";
import { domainAcceptsMail } from "@/lib/server/email-check";
import { resumeExists, saveStudentApplication } from "@/lib/server/submissions";

export const runtime = "nodejs";

/**
 * Receives a student application as JSON. The resume is uploaded
 * first through /api/uploads/resume and referenced here by id.
 */
export async function POST(request: Request) {
  let parsed: Partial<StudentApplication>;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid application data." }, { status: 400 });
  }

  const application: StudentApplication = { ...emptyStudentApplication, ...parsed };
  for (const key of ["skillsText", "interestsText", "rolesText"] as const) {
    application[key] = typeof application[key] === "string" ? application[key].slice(0, 500) : "";
  }
  const errors = validateStudentApplication(application);
  if (!application.resume?.id || !(await resumeExists(application.resume.id))) {
    errors.resume = "Upload your resume again.";
  }
  if (!errors.referrals) {
    const checks = await Promise.all(
      application.referrals.map((r) => domainAcceptsMail(r.email.trim().split("@")[1] ?? ""))
    );
    const bad = checks.indexOf(false);
    if (bad >= 0) errors.referrals = `The email for person ${bad + 1} can't receive mail. Check it for typos.`;
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const id = await saveStudentApplication(application);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
