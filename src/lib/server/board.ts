import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

import { findIn, slotsFrom, type Slot } from "@/lib/interviews";
import { sanitizeProfile, type StudentProfile } from "@/lib/profile";
import { store } from "@/lib/server/store";

/**
 * The board page (/board) for whoever runs interviews. One shared
 * password, BOARD_PASSWORD, set in .env.local or Vercel. Without it the
 * board stays locked. The cookie holds a hash of the password, so
 * changing the password signs everyone out.
 *
 * On localhost (`npm run dev`) the board is always open, so whoever is
 * building the site can switch between the board and the student side
 * freely. The live site (a production build) always asks for the password.
 */
export const BOARD_COOKIE = "core_board";

/** `npm run dev`. The board is only open without a password when it's also opened as localhost. */
export const openForDevelopers = process.env.NODE_ENV === "development";

/** Opened on this machine itself, not from another device on the same Wi-Fi. */
async function onThisMachine() {
  const host = ((await headers()).get("host") ?? "").toLowerCase();
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

/** True when the board is open without a password (developing on localhost). */
export async function developerAccess() {
  return openForDevelopers && (await onThisMachine());
}

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
  if (await developerAccess()) return true;
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
  booking: Slot | null;
};

const str = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) ? v.filter((x) => typeof x === "string").join(", ") : "");

export async function loadApplicants(): Promise<Applicant[]> {
  const [apps, profiles, bookings, windows] = await Promise.all([store.allApplications(), store.allProfiles(), store.bookings(), store.windows()]);
  const slots = slotsFrom(windows);
  const slotOf: Record<string, string> = {};
  for (const [slotId, appId] of Object.entries(bookings)) slotOf[appId] = slotId;
  return apps.map(({ id, receivedAt, application: a }) => {
    const slot = slotOf[id] ? findIn(slots, slotOf[id]) : null;
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
      booking: slot,
    };
  });
}

