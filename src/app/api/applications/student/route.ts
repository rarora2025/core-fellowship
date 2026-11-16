import { NextResponse } from "next/server";

import {
  emptyStudentApplication,
  validateStudentApplication,
  type StudentApplication,
} from "@/lib/applications/student";

/**
 * Receives a student application as multipart form data:
 *   data:   JSON StudentApplication
 *   resume: optional PDF file
 *
 * TODO(backend): nothing is stored yet. Save the application and
 * resume (database + file storage) and notify the CORE team here.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  let parsed: Partial<StudentApplication>;
  try {
    parsed = JSON.parse(String(form.get("data") ?? "{}"));
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid application data." }, { status: 400 });
  }

  const file = form.get("resume");
  const resume =
    file instanceof File && file.size > 0 ? { name: file.name, size: file.size, type: file.type } : null;

  const application: StudentApplication = { ...emptyStudentApplication, ...parsed, resume };
  const errors = validateStudentApplication(application);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
