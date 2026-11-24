import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Where everything is saved.
 *
 * - With SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set (in .env.local
 *   on your machine, or in Vercel's environment variables), data goes
 *   to Supabase. Run supabase/schema.sql once to set up the tables.
 * - Without them, it falls back to files in ./.submissions, which is
 *   fine on localhost but does not persist on Vercel.
 *
 * Talks to Supabase over its REST API, so there's no extra package.
 */

const SB_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const usingSupabase = Boolean(SB_URL && SB_KEY);

const ID = /^[a-f0-9-]{36}$/;

export type StoredApplication = { id: string; receivedAt: string; application: Record<string, unknown> };

/* ------------------------------------------------------------------ */
/* Supabase                                                             */
/* ------------------------------------------------------------------ */

class SupabaseError extends Error {}

async function sb(pathname: string, init: RequestInit & { prefer?: string } = {}) {
  const res = await fetch(`${SB_URL}${pathname}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: SB_KEY!,
      // The old service_role key is a JWT and goes in Authorization too.
      // The newer sb_secret_ keys aren't JWTs: the apikey header alone is enough.
      ...(SB_KEY?.startsWith("eyJ") ? { Authorization: `Bearer ${SB_KEY}` } : {}),
      ...(init.body && !(init.body instanceof Uint8Array || Buffer.isBuffer(init.body)) ? { "Content-Type": "application/json" } : {}),
      ...(init.prefer ? { Prefer: init.prefer } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new SupabaseError(`Supabase ${init.method ?? "GET"} ${pathname.split("?")[0]} failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const q = encodeURIComponent;

const supabase = {
  async saveResume(bytes: Uint8Array) {
    const id = randomUUID();
    await sb(`/storage/v1/object/resumes/${id}.pdf`, {
      method: "POST",
      body: Buffer.from(bytes),
      headers: { "Content-Type": "application/pdf", "x-upsert": "false" },
    });
    await sb("/rest/v1/resumes", { method: "POST", body: JSON.stringify({ id, size: bytes.byteLength }) });
    return id;
  },
  async resumeExists(id: string) {
    const rows = await sb(`/rest/v1/resumes?id=eq.${q(id)}&select=id`);
    return Array.isArray(rows) && rows.length > 0;
  },
  async saveApplication(application: Record<string, unknown>) {
    const rows = await sb("/rest/v1/applications?select=id", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({ name: application.name ?? null, email: application.email ?? null, data: application }),
    });
    return rows[0].id as string;
  },
  async getApplication(id: string): Promise<StoredApplication | null> {
    const rows = await sb(`/rest/v1/applications?id=eq.${q(id)}&select=id,received_at,data`);
    const r = rows?.[0];
    return r ? { id: r.id, receivedAt: r.received_at, application: r.data } : null;
  },
  async createToken(token: string, applicationId: string) {
    await sb("/rest/v1/portal_tokens", { method: "POST", body: JSON.stringify({ token, application_id: applicationId }) });
  },
  async applicationIdForToken(token: string) {
    const rows = await sb(`/rest/v1/portal_tokens?token=eq.${q(token)}&select=application_id`);
    return (rows?.[0]?.application_id as string) ?? null;
  },
  async readProfile(applicationId: string) {
    const rows = await sb(`/rest/v1/profiles?application_id=eq.${q(applicationId)}&select=profile`);
    return rows?.[0]?.profile ?? null;
  },
  async saveProfile(applicationId: string, profile: unknown) {
    await sb("/rest/v1/profiles?on_conflict=application_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: JSON.stringify({ application_id: applicationId, profile, updated_at: new Date().toISOString() }),
    });
  },
  async bookings(): Promise<Record<string, string>> {
    const rows: { slot_id: string; application_id: string }[] = await sb("/rest/v1/bookings?select=slot_id,application_id");
    return Object.fromEntries(rows.map((r) => [r.slot_id, r.application_id]));
  },
  async book(applicationId: string, slotId: string) {
    return (await sb("/rest/v1/rpc/book_slot", {
      method: "POST",
      body: JSON.stringify({ p_application: applicationId, p_slot: slotId }),
    })) === true;
  },
  async cancel(applicationId: string) {
    await sb(`/rest/v1/bookings?application_id=eq.${q(applicationId)}`, { method: "DELETE" });
  },
  async allApplications(): Promise<StoredApplication[]> {
    const rows: { id: string; received_at: string; data: Record<string, unknown> }[] = await sb(
      "/rest/v1/applications?select=id,received_at,data&order=received_at.desc&limit=5000"
    );
    return rows.map((r) => ({ id: r.id, receivedAt: r.received_at, application: r.data }));
  },
  async allProfiles(): Promise<Record<string, unknown>> {
    const rows: { application_id: string; profile: unknown }[] = await sb("/rest/v1/profiles?select=application_id,profile&limit=5000");
    return Object.fromEntries(rows.map((r) => [r.application_id, r.profile]));
  },
  /** A link to the PDF that works for ten minutes. */
  async resume(id: string): Promise<{ url: string } | null> {
    const res = await sb(`/storage/v1/object/sign/resumes/${q(id)}.pdf`, {
      method: "POST",
      body: JSON.stringify({ expiresIn: 600 }),
    }).catch(() => null);
    const path = res?.signedURL ?? res?.signedUrl;
    return path ? { url: `${SB_URL}/storage/v1${path}` } : null;
  },
};

/* ------------------------------------------------------------------ */
/* Local files (fallback for localhost)                                 */
/* ------------------------------------------------------------------ */

const ROOT = path.join(process.cwd(), ".submissions");
const RESUMES = path.join(ROOT, "resumes");
const STUDENTS = path.join(ROOT, "students");
const PROFILES = path.join(ROOT, "profiles");
const TOKENS = path.join(ROOT, "portal", "tokens.json");
const BOOKINGS = path.join(ROOT, "bookings.json");

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
/** Serialize writes to shared files so two requests can't race. */
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

const files = {
  async saveResume(bytes: Uint8Array) {
    const id = randomUUID();
    await mkdir(RESUMES, { recursive: true });
    await writeFile(path.join(RESUMES, `${id}.pdf`), bytes);
    return id;
  },
  async resumeExists(id: string) {
    try {
      return (await stat(path.join(RESUMES, `${id}.pdf`))).isFile();
    } catch {
      return false;
    }
  },
  async saveApplication(application: Record<string, unknown>) {
    const id = randomUUID();
    await writeJson(path.join(STUDENTS, `${id}.json`), { id, receivedAt: new Date().toISOString(), application });
    return id;
  },
  async getApplication(id: string): Promise<StoredApplication | null> {
    return readJson<StoredApplication | null>(path.join(STUDENTS, `${id}.json`), null);
  },
  createToken(token: string, applicationId: string) {
    return locked(async () => {
      const map = await readJson<Record<string, string>>(TOKENS, {});
      map[token] = applicationId;
      await writeJson(TOKENS, map);
    });
  },
  async applicationIdForToken(token: string) {
    return (await readJson<Record<string, string>>(TOKENS, {}))[token] ?? null;
  },
  async readProfile(applicationId: string) {
    const raw = await readJson<{ profile?: unknown } | null>(path.join(PROFILES, `${applicationId}.json`), null);
    return raw?.profile ?? null;
  },
  async saveProfile(applicationId: string, profile: unknown) {
    await writeJson(path.join(PROFILES, `${applicationId}.json`), { id: applicationId, updatedAt: new Date().toISOString(), profile });
  },
  async bookings(): Promise<Record<string, string>> {
    const raw = await readJson<Record<string, { applicationId: string }>>(BOOKINGS, {});
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.applicationId]));
  },
  book(applicationId: string, slotId: string) {
    return locked(async () => {
      const raw = await readJson<Record<string, { applicationId: string; bookedAt: string }>>(BOOKINGS, {});
      if (raw[slotId] && raw[slotId].applicationId !== applicationId) return false;
      for (const k of Object.keys(raw)) if (raw[k].applicationId === applicationId) delete raw[k];
      raw[slotId] = { applicationId, bookedAt: new Date().toISOString() };
      await writeJson(BOOKINGS, raw);
      return true;
    });
  },
  cancel(applicationId: string) {
    return locked(async () => {
      const raw = await readJson<Record<string, { applicationId: string }>>(BOOKINGS, {});
      for (const k of Object.keys(raw)) if (raw[k].applicationId === applicationId) delete raw[k];
      await writeJson(BOOKINGS, raw);
    });
  },
  async allApplications(): Promise<StoredApplication[]> {
    const names = await readdir(STUDENTS).catch(() => [] as string[]);
    const all = await Promise.all(
      names.filter((n) => n.endsWith(".json")).map((n) => readJson<StoredApplication | null>(path.join(STUDENTS, n), null))
    );
    return all.filter((a): a is StoredApplication => !!a).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  },
  async allProfiles(): Promise<Record<string, unknown>> {
    const names = await readdir(PROFILES).catch(() => [] as string[]);
    const out: Record<string, unknown> = {};
    for (const n of names.filter((n) => n.endsWith(".json"))) {
      const raw = await readJson<{ profile?: unknown } | null>(path.join(PROFILES, n), null);
      if (raw?.profile) out[n.slice(0, -5)] = raw.profile;
    }
    return out;
  },
  async resume(id: string): Promise<{ bytes: Uint8Array } | null> {
    try {
      return { bytes: await readFile(path.join(RESUMES, `${id}.pdf`)) };
    } catch {
      return null;
    }
  },
};

/* ------------------------------------------------------------------ */

const backend = usingSupabase ? supabase : files;

export const store = {
  saveResume: (bytes: Uint8Array) => backend.saveResume(bytes),
  resumeExists: (id: string) => (ID.test(id) ? backend.resumeExists(id) : Promise.resolve(false)),
  saveApplication: (a: Record<string, unknown>) => backend.saveApplication(a),
  getApplication: (id: string) => (ID.test(id) ? backend.getApplication(id) : Promise.resolve(null)),
  createToken: (token: string, applicationId: string) => backend.createToken(token, applicationId),
  applicationIdForToken: (token: string) => backend.applicationIdForToken(token),
  readProfile: (applicationId: string) => backend.readProfile(applicationId),
  saveProfile: (applicationId: string, profile: unknown) => backend.saveProfile(applicationId, profile),
  bookings: () => backend.bookings(),
  /** Book or move. False when someone else already holds the slot. */
  book: (applicationId: string, slotId: string) => backend.book(applicationId, slotId),
  cancel: (applicationId: string) => backend.cancel(applicationId),
  /** Board only. */
  allApplications: () => backend.allApplications(),
  allProfiles: () => backend.allProfiles(),
  resume: (id: string): Promise<{ url?: string; bytes?: Uint8Array } | null> =>
    ID.test(id) ? backend.resume(id) : Promise.resolve(null),
};
