import { NextResponse } from "next/server";

import { sanitizeProfile } from "@/lib/profile";
import { currentStudent, readProfile, saveProfile } from "@/lib/server/portal";

export const runtime = "nodejs";

export async function GET() {
  const me = await currentStudent();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ ok: true, profile: await readProfile(me.id) });
}

/** Saves the whole profile. The builder sends it after every step. */
export async function PUT(request: Request) {
  const me = await currentStudent();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid profile data." }, { status: 400 });
  }
  const profile = sanitizeProfile(body);
  await saveProfile(me.id, profile);
  return NextResponse.json({ ok: true, profile });
}
