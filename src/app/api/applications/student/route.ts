import { NextResponse } from "next/server";

import {
  emptyStudentApplication,
  validateStudentApplication,
  type StudentApplication,
} from "@/lib/applications/student";
import { checkProfileField, profileFields, sanitizeProfile } from "@/lib/profile";
import { resumeExists, saveStudentApplication } from "@/lib/server/submissions";
import { createPortalToken, saveProfile, SESSION_COOKIE, sessionCookie } from "@/lib/server/portal";

export const runtime = "nodejs";

/**
 * Receives a student application as JSON, with the profile answers
 * inside it. The resume is uploaded first through /api/uploads/resume
 * and referenced here by id.
 */
export async function POST(request: Request) {
  let parsed: Partial<StudentApplication>;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid application data." }, { status: 400 });
  }

  const profile = sanitizeProfile(parsed.profile);
  const application: StudentApplication = { ...emptyStudentApplication, ...parsed, profile };
  const errors: Record<string, string> = { ...validateStudentApplication(application) };
  for (const f of profileFields) {
    const msg = checkProfileField(f, profile);
    if (msg) errors[f] = msg;
  }
  if (!application.resume?.id || !(await resumeExists(application.resume.id))) {
    errors.resume = "Upload your resume again.";
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  // The profile lives in its own table, so the portal can edit it later.
  const { profile: _profile, ...rest } = application;
  void _profile;
  const id = await saveStudentApplication(rest);
  await saveProfile(id, profile);

  // Sign the student into their portal right away, and hand back a
  // private link they can use to get back in later.
  const token = await createPortalToken(id);
  const res = NextResponse.json(
    { ok: true, id, portalUrl: `/portal/enter?key=${token}`, next: "/portal/interview" },
    { status: 201 }
  );
  res.cookies.set(SESSION_COOKIE, token, sessionCookie);
  return res;
}
