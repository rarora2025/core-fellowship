import { NextResponse } from "next/server";

import { applicationIdForToken, SESSION_COOKIE, sessionCookie } from "@/lib/server/portal";

export const runtime = "nodejs";

/** Private link → sets the portal cookie → portal home. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const id = await applicationIdForToken(key);
  const res = NextResponse.redirect(new URL(id ? "/portal" : "/portal?link=invalid", url));
  if (id && key) res.cookies.set(SESSION_COOKIE, key, sessionCookie);
  return res;
}
