import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { emptyProfile, sanitizeProfile, type StudentProfile } from "@/lib/profile";
import { findSlot, isOpen, type Slot } from "@/lib/interviews";
import { store } from "@/lib/server/store";

/**
 * The student portal: who's signed in, their profile, their interview.
 * Data lives wherever src/lib/server/store.ts points (Supabase, or
 * local files on localhost).
 *
 * The private link (/portal/enter?key=…) is the login for now.
 * TODO(backend): add real sign-in (e.g. Supabase Auth magic links) so
 * people can get back in on any device without their link.
 */
export const SESSION_COOKIE = "core_portal";
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

/* ---------- identity ---------- */

export async function createPortalToken(applicationId: string) {
  const token = randomBytes(24).toString("base64url");
  await store.createToken(token, applicationId);
  return token;
}

export async function applicationIdForToken(token: string | undefined | null) {
  if (!token || !TOKEN.test(token)) return null;
  return store.applicationIdForToken(token);
}

export type PortalStudent = {
  id: string;
  token: string;
  name: string;
  email: string;
  gradYear: string;
  major: string;
  receivedAt: string;
};

/** The signed-in student, from the portal cookie. */
export async function currentStudent(): Promise<PortalStudent | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = await applicationIdForToken(token);
  if (!id) return null;
  const record = await store.getApplication(id);
  if (!record) return null;
  const a = record.application as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : "");
  return {
    id,
    token: token!,
    name: str(a.name),
    email: str(a.email),
    gradYear: str(a.gradYear),
    major: str(a.major),
    receivedAt: record.receivedAt ?? "",
  };
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 180,
};

/* ---------- profile ---------- */

export async function readProfile(id: string): Promise<StudentProfile> {
  const raw = await store.readProfile(id);
  return raw ? sanitizeProfile(raw) : { ...emptyProfile };
}

export async function saveProfile(id: string, profile: StudentProfile) {
  await store.saveProfile(id, profile);
}

/* ---------- interviews ---------- */

export async function bookingFor(id: string): Promise<Slot | null> {
  const bookings = await store.bookings();
  const slotId = Object.keys(bookings).find((k) => bookings[k] === id);
  return slotId ? findSlot(slotId) : null;
}

export async function takenSlotIds(): Promise<string[]> {
  return Object.keys(await store.bookings());
}

export class BookingError extends Error {}

/** Book (or move) this student's interview. One booking per student. */
export async function bookSlot(id: string, slotId: string) {
  const slot = findSlot(slotId);
  if (!slot) throw new BookingError("That time doesn't exist anymore. Pick another.");
  if (!isOpen(slot)) throw new BookingError("That time is too soon to book. Pick a later one.");
  const current = await bookingFor(id);
  if (current && current.id !== slotId && !isOpen(current)) {
    throw new BookingError("Your interview is too soon to move. Email us instead.");
  }
  if (!(await store.book(id, slotId))) throw new BookingError("Someone just took that time. Pick another.");
  return slot;
}

export async function cancelBooking(id: string) {
  const current = await bookingFor(id);
  if (current && !isOpen(current)) throw new BookingError("Your interview is too soon to cancel here. Email us instead.");
  await store.cancel(id);
}
