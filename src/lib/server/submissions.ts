import "server-only";

import { store } from "@/lib/server/store";

/**
 * Application storage. Saves to Supabase when it's configured,
 * otherwise to local files. See src/lib/server/store.ts.
 */

export function saveResume(bytes: Uint8Array) {
  return store.saveResume(bytes);
}

export function resumeExists(id: string) {
  return store.resumeExists(id);
}

export function saveStudentApplication(application: unknown) {
  return store.saveApplication(application as Record<string, unknown>);
}
