import { NextResponse } from "next/server";

import { resumeRules } from "@/content/student-application";
import { estimatePdfPages, looksLikePdf } from "@/lib/pdf";
import { saveResume } from "@/lib/server/submissions";

export const runtime = "nodejs";

/** Takes one PDF as multipart field "file", checks it, stores it, returns its id. */
export async function POST(request: Request) {
  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't read that upload." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "That file looks empty." }, { status: 400 });
  }
  if (file.size > resumeRules.maxBytes) {
    return NextResponse.json({ ok: false, error: "That file is over 5 MB." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikePdf(bytes)) {
    return NextResponse.json({ ok: false, error: "That file isn't a readable PDF." }, { status: 415 });
  }

  const id = await saveResume(bytes);
  return NextResponse.json(
    {
      ok: true,
      resume: { id, name: file.name, size: file.size, type: "application/pdf", pages: estimatePdfPages(bytes) },
    },
    { status: 201 }
  );
}
