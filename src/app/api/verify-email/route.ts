import { NextResponse } from "next/server";

import { suggestEmail } from "@/lib/email-typos";
import { domainAcceptsMail } from "@/lib/server/email-check";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST { email } → { valid, deliverable, suggestion } */
export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: unknown };
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return NextResponse.json({ valid: false, deliverable: false, suggestion: null });
  }
  const domain = email.trim().split("@")[1];
  const deliverable = await domainAcceptsMail(domain);
  return NextResponse.json({ valid: true, deliverable, suggestion: suggestEmail(email) });
}
