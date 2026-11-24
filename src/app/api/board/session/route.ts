import { NextResponse } from "next/server";

import { BOARD_COOKIE, boardCookie, checkBoardPassword } from "@/lib/server/board";

export const runtime = "nodejs";

/** POST { password } → signs into the board. DELETE → signs out. */
export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: unknown };
  const value = typeof password === "string" && password.length <= 200 ? checkBoardPassword(password) : null;
  if (!value) return NextResponse.json({ ok: false, error: "That's not the password." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BOARD_COOKIE, value, boardCookie);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BOARD_COOKIE, "", { ...boardCookie, maxAge: 0 });
  return res;
}
