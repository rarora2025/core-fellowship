import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local file storage for applications while there's no backend.
 * Everything lands in ./.submissions (git-ignored).
 *
 * TODO(backend): swap these for a database + object storage
 * (e.g. Postgres + S3/R2). Files on disk don't persist on Vercel.
 */
const ROOT = path.join(process.cwd(), ".submissions");
const RESUMES = path.join(ROOT, "resumes");
const STUDENTS = path.join(ROOT, "students");

const ID = /^[a-f0-9-]{36}$/;

export async function saveResume(bytes: Uint8Array) {
  const id = randomUUID();
  await mkdir(RESUMES, { recursive: true });
  await writeFile(path.join(RESUMES, `${id}.pdf`), bytes);
  return id;
}

export async function resumeExists(id: string) {
  if (!ID.test(id)) return false;
  try {
    return (await stat(path.join(RESUMES, `${id}.pdf`))).isFile();
  } catch {
    return false;
  }
}

export async function saveStudentApplication(application: unknown) {
  const id = randomUUID();
  await mkdir(STUDENTS, { recursive: true });
  await writeFile(
    path.join(STUDENTS, `${id}.json`),
    JSON.stringify({ id, receivedAt: new Date().toISOString(), application }, null, 2)
  );
  return id;
}
