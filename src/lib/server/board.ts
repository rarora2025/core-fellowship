import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { interviewers } from "@/content/interviews";
import { findSlot, interviewerOf, type Slot } from "@/lib/interviews";
import { sanitizeProfile, type StudentProfile } from "@/lib/profile";
import { store } from "@/lib/server/store";

/**
 * The board page (/board) for whoever runs interviews. One shared
 * password, BOARD_PASSWORD, set in .env.local or Vercel. Without it the
 * board stays locked. The cookie holds a hash of the password, so
 * changing the password signs everyone out.
 */
export const BOARD_COOKIE = "core_board";

function hashOf(password: string) {
  return createHash("sha256").update(`core-board:${password}`).digest("hex");
}

export function boardConfigured() {
  return !!process.env.BOARD_PASSWORD;
}

export function checkBoardPassword(password: string) {
  const real = process.env.BOARD_PASSWORD;
  if (!real) return null;
  const a = Buffer.from(hashOf(password));
  const b = Buffer.from(hashOf(real));
  return timingSafeEqual(a, b) ? hashOf(real) : null;
}

export async function onBoard() {
  const real = process.env.BOARD_PASSWORD;
  if (!real) return false;
  const got = (await cookies()).get(BOARD_COOKIE)?.value ?? "";
  const want = hashOf(real);
  return got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export const boardCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 60,
};

export type Applicant = {
  id: string;
  receivedAt: string;
  name: string;
  email: string;
  gradYear: string;
  major: string;
  linkedin: string;
  workLink: string;
  resumeId: string | null;
  referrals: { name: string; email: string }[];
  profile: StudentProfile;
  booking: (Slot & { interviewerName: string }) | null;
};

const str = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) ? v.filter((x) => typeof x === "string").join(", ") : "");

export async function loadApplicants(): Promise<Applicant[]> {
  const [apps, profiles, bookings] = await Promise.all([store.allApplications(), store.allProfiles(), store.bookings()]);
  const slotOf: Record<string, string> = {};
  for (const [slotId, appId] of Object.entries(bookings)) slotOf[appId] = slotId;
  return apps.map(({ id, receivedAt, application: a }) => {
    const slot = slotOf[id] ? findSlot(slotOf[id]) : null;
    const resume = a.resume as { id?: string } | null;
    const referrals = Array.isArray(a.referrals) ? (a.referrals as { name?: unknown; email?: unknown }[]) : [];
    return {
      id,
      receivedAt,
      name: str(a.name),
      email: str(a.email),
      gradYear: str(a.gradYear),
      major: str(a.major),
      linkedin: str(a.linkedin),
      workLink: str(a.workLink),
      resumeId: typeof resume?.id === "string" ? resume.id : null,
      referrals: referrals.map((r) => ({ name: str(r.name), email: str(r.email) })).filter((r) => r.name || r.email),
      profile: sanitizeProfile(profiles[id]),
      booking: slot ? { ...slot, interviewerName: interviewerOf(slot).name } : null,
    };
  });
}

export const interviewerNames = Object.values(interviewers).map((i) => i.name);
