import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";

import { emptyProfile, sanitizeProfile, type StudentProfile } from "@/lib/profile";
import { findSlot, isOpen, type Slot } from "@/lib/interviews";

/**
 * Portal storage, alongside the application files in ./.submissions.
 *
 *   portal/tokens.json      token → application id
 *   profiles/<id>.json      the student's profile
 *   bookings.json           slot id → application id
 *
 * The private link (/portal/enter?key=…) is the login for now.
 * TODO(backend): move to the database and add real sign-in
 * (e.g. an emailed magic link) so people can get back in on any device.
 */
const ROOT = path.join(process.cwd(), ".submissions");
const TOKENS = path.join(ROOT, "portal", "tokens.json");
const PROFILES = path.join(ROOT, "profiles");
const STUDENTS = path.join(ROOT, "students");
const BOOKINGS = path.join(ROOT, "bookings.json");

export const SESSION_COOKIE = "core_portal";
const ID = /^[a-f0-9-]{36}$/;
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, file);
}

/** Serialize writes to shared files so two bookings can't race. */
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

/* ---------- identity ---------- */

export async function createPortalToken(applicationId: string) {
  const token = randomBytes(24).toString("base64url");
  await locked(async () => {
    const map = await readJson<Record<string, string>>(TOKENS, {});
    map[token] = applicationId;
    await writeJson(TOKENS, map);
  });
  return token;
}

export async function applicationIdForToken(token: string | undefined | null) {
  if (!token || !TOKEN.test(token)) return null;
  const map = await readJson<Record<string, string>>(TOKENS, {});
  return map[token] ?? null;
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
  if (!id || !ID.test(id)) return null;
  const record = await readJson<{ receivedAt?: string; application?: Record<string, string> } | null>(
    path.join(STUDENTS, `${id}.json`),
    null
  );
  if (!record?.application) return null;
  const a = record.application;
  return {
    id,
    token: token!,
    name: a.name ?? "",
    email: a.email ?? "",
    gradYear: a.gradYear ?? "",
    major: a.major ?? "",
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
  const raw = await readJson<unknown>(path.join(PROFILES, `${id}.json`), null);
  return raw ? sanitizeProfile((raw as { profile?: unknown }).profile ?? raw) : { ...emptyProfile };
}

export async function saveProfile(id: string, profile: StudentProfile) {
  await writeJson(path.join(PROFILES, `${id}.json`), { id, updatedAt: new Date().toISOString(), profile });
}

/* ---------- interviews ---------- */

type Bookings = Record<string, { applicationId: string; bookedAt: string }>;

export async function bookingFor(id: string): Promise<Slot | null> {
  const bookings = await readJson<Bookings>(BOOKINGS, {});
  const slotId = Object.keys(bookings).find((k) => bookings[k].applicationId === id);
  return slotId ? findSlot(slotId) : null;
}

export async function takenSlotIds(): Promise<string[]> {
  return Object.keys(await readJson<Bookings>(BOOKINGS, {}));
}

export class BookingError extends Error {}

/** Book (or move) this student's interview. One booking per student. */
export function bookSlot(id: string, slotId: string) {
  return locked(async () => {
    const slot = findSlot(slotId);
    if (!slot) throw new BookingError("That time doesn't exist anymore. Pick another.");
    if (!isOpen(slot)) throw new BookingError("That time is too soon to book. Pick a later one.");
    const bookings = await readJson<Bookings>(BOOKINGS, {});
    const holder = bookings[slotId];
    if (holder && holder.applicationId !== id) throw new BookingError("Someone just took that time. Pick another.");
    for (const k of Object.keys(bookings)) {
      if (bookings[k].applicationId === id) {
        const current = findSlot(k);
        if (current && !isOpen(current)) throw new BookingError("Your interview is too soon to move. Email us instead.");
        delete bookings[k];
      }
    }
    bookings[slotId] = { applicationId: id, bookedAt: new Date().toISOString() };
    await writeJson(BOOKINGS, bookings);
    return slot;
  });
}

export function cancelBooking(id: string) {
  return locked(async () => {
    const bookings = await readJson<Bookings>(BOOKINGS, {});
    for (const k of Object.keys(bookings)) {
      if (bookings[k].applicationId !== id) continue;
      const slot = findSlot(k);
      if (slot && !isOpen(slot)) throw new BookingError("Your interview is too soon to cancel here. Email us instead.");
      delete bookings[k];
    }
    await writeJson(BOOKINGS, bookings);
  });
}
