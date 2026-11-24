import { NextResponse } from "next/server";

import {
  emptyStudentApplication,
  validateStudentApplication,
  type StudentApplication,
} from "@/lib/applications/student";
import { resumeExists, saveStudentApplication } from "@/lib/server/submissions";
import { createPortalToken, SESSION_COOKIE, sessionCookie } from "@/lib/server/portal";

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
  const errors = validateStudentApplication(application);
  if (!application.resume?.id || !(await resumeExists(application.resume.id))) {
    errors.resume = "Upload your resume again.";
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const id = await saveStudentApplication(application);

  // Sign the student into their portal right away, and hand back a
  // private link they can use to get back in later.
  const token = await createPortalToken(id);
  const res = NextResponse.json({ ok: true, id, portalUrl: `/portal/enter?key=${token}` }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookie);
  return res;
}
