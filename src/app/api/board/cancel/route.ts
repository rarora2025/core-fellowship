import { NextResponse } from "next/server";

import { cancelFromBoard, onBoard } from "@/lib/server/board";

export const runtime = "nodejs";

/** POST { applicationId, note? } → cancels their conversation and emails them to rebook. */
export async function POST(request: Request) {
  if (!(await onBoard())) return NextResponse.json({ ok: false, error: "Sign in to the board first." }, { status: 401 });
  const { applicationId, note } = (await request.json().catch(() => ({}))) as { applicationId?: unknown; note?: unknown };
  if (typeof applicationId !== "string") return NextResponse.json({ ok: false, error: "Pick someone to cancel." }, { status: 400 });
  const res = await cancelFromBoard(applicationId, typeof note === "string" ? note : "");
  return NextResponse.json(res, { status: res.ok ? 200 : 409 });
}
