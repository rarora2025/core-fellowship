import { NextResponse } from "next/server";

import { onBoard } from "@/lib/server/board";
import { store } from "@/lib/server/store";

export const runtime = "nodejs";

/** Opens a resume for the board: a short-lived Supabase link, or the local file. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await onBoard())) return new Response("Sign in to the board first.", { status: 401 });
  const { id } = await params;
  const file = await store.resume(id);
  if (!file) return new Response("That resume isn't there.", { status: 404 });
  if (file.url) return NextResponse.redirect(file.url);
  return new Response(Buffer.from(file.bytes!), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline", "Cache-Control": "private, no-store" },
  });
}
