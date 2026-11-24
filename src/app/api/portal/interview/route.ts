import { NextResponse } from "next/server";

import { BookingError, bookSlot, cancelBooking, currentStudent } from "@/lib/server/portal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const me = await currentStudent();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const { slotId } = (await request.json().catch(() => ({}))) as { slotId?: string };
  if (typeof slotId !== "string") return NextResponse.json({ ok: false, error: "Pick a time." }, { status: 400 });
  try {
    const slot = await bookSlot(me.id, slotId);
    return NextResponse.json({ ok: true, slot });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ ok: false, error: e.message }, { status: 409 });
    throw e;
  }
}

export async function DELETE() {
  const me = await currentStudent();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  try {
    await cancelBooking(me.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ ok: false, error: e.message }, { status: 409 });
    throw e;
  }
}
