import { NextResponse } from "next/server";

import {
  emptyStudentApplication,
  validateStudentApplication,
  type StudentApplication,
} from "@/lib/applications/student";
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
  const errors = validateStudentApplication(application);
  if (!application.resume?.id || !(await resumeExists(application.resume.id))) {
    errors.resume = "Upload your resume again.";
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const id = await saveStudentApplication(application);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
