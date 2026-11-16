import { NextResponse } from "next/server";

import { linkedinSearchAvailable, searchLinkedIn } from "@/lib/server/linkedin-search";

export const runtime = "nodejs";

/** POST { name, gradYear, major } → { available, results } */
export async function POST(request: Request) {
  if (!linkedinSearchAvailable()) return NextResponse.json({ available: false, results: [] });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.slice(0, 80) : "";
  if (name.trim().split(/\s+/).length < 1 || !name.trim()) {
    return NextResponse.json({ available: true, results: [] });
  }
  try {
    const results = await searchLinkedIn({
      name,
      gradYear: typeof body.gradYear === "string" ? body.gradYear.slice(0, 20) : undefined,
      major: typeof body.major === "string" ? body.major.slice(0, 60) : undefined,
    });
    return NextResponse.json({ available: true, results });
  } catch {
    return NextResponse.json({ available: true, results: [] });
  }
}
