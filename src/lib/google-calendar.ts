/**
 * Google Calendar busy times on the board's Schedule tab, ported from
 * LionApps. Everything here runs in the person's own browser: Google hands
 * the browser a short-lived pass for one thing only ("see when you're busy"),
 * the browser asks Google when they're busy that week, and the answer (start
 * and end times, never event names) is drawn on their own grid. The site's
 * server never sees the pass or the busy times, nothing is saved, and the
 * pass lives in this page's memory until it runs out (about an hour) or the
 * page is reloaded. Google's script is only fetched when someone presses the
 * button.
 */

// Not a secret: the public name of a Google sign-in client. Set
// NEXT_PUBLIC_GOOGLE_CLIENT_ID to use CORE's own; until then this is the
// one from LionApps' Google project, so Google's window says "LionApps".
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "1010956450592-t93v2hntbtrepnbbci5sn8me72sitvvq.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/calendar.freebusy";
const HOST = "https://accounts.google.com";

export type Busy = { start: number; end: number };

type TokenResponse = { access_token?: string; error?: string; expires_in?: number | string };
type GoogleOauth = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    include_granted_scopes?: boolean;
    callback: (response: TokenResponse) => void;
    error_callback?: (problem: { type?: string }) => void;
  }) => { requestAccessToken: () => void };
  hasGrantedAllScopes: (response: TokenResponse, ...scopes: string[]) => boolean;
};
const oauth = () =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { google?: { accounts?: { oauth2?: GoogleOauth } } }).google?.accounts?.oauth2;

export const googleReady = () => !!oauth();

/** Open a connection to Google early so its script arrives quickly when pressed. */
export function warmGoogle() {
  if (typeof document === "undefined" || document.querySelector(`link[rel="preconnect"][href="${HOST}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = HOST;
  document.head.appendChild(link);
}

let loading: Promise<boolean> | null = null;
/** Fetch Google's own sign-in script, once. Resolves to whether it's usable. */
export function loadGoogle(): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  if (googleReady()) return Promise.resolve(true);
  loading ??= new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = `${HOST}/gsi/client`;
    script.async = true;
    script.onload = () => resolve(googleReady());
    script.onerror = () => {
      loading = null;
      script.remove();
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return loading;
}

type Pass = { token: string; until: number };
let passes: Pass[] = [];
const live = () => (passes = passes.filter((p) => Date.now() < p.until));
export const googleConnected = () => live().length > 0;

export type GoogleProblem = "blocked" | "closed" | "denied" | "failed";

/** Ask Google for the pass; it opens its own window. Call straight from a click. */
export function askGoogle(): Promise<{ token: string } | { problem: GoogleProblem }> {
  return new Promise((resolve) => {
    const google = oauth();
    if (!google) return resolve({ problem: "failed" });
    try {
      google
        .initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPE,
          include_granted_scopes: false,
          callback: (response) => {
            if (response.error || !response.access_token) resolve({ problem: response.error === "access_denied" ? "denied" : "failed" });
            else if (!google.hasGrantedAllScopes(response, SCOPE)) resolve({ problem: "denied" });
            else {
              passes.push({ token: response.access_token, until: Date.now() + (Number(response.expires_in) || 3600) * 1000 - 60_000 });
              resolve({ token: response.access_token });
            }
          },
          error_callback: (problem) =>
            resolve({
              problem: problem?.type === "popup_failed_to_open" ? "blocked" : problem?.type === "popup_closed" ? "closed" : "failed",
            }),
        })
        .requestAccessToken();
    } catch {
      resolve({ problem: "failed" });
    }
  });
}

/** Google's free/busy answer → busy stretches. Null if it isn't one. */
export function readBusy(answer: unknown): Busy[] | null {
  const calendars = (answer as { calendars?: Record<string, { busy?: { start?: string; end?: string }[] } | null> } | null)?.calendars;
  if (!calendars || typeof calendars !== "object") return null;
  const all = Object.values(calendars);
  if (all.length === 0 || all.every((c) => !Array.isArray(c?.busy))) return null;
  return all
    .flatMap((c) => (Array.isArray(c?.busy) ? c.busy : []))
    .map((b) => ({ start: Date.parse(b?.start ?? ""), end: Date.parse(b?.end ?? "") }))
    .filter((b) => b.end > b.start);
}

/** Which grid cells (ISO starts, `minutes` long) a busy stretch runs into; touching an edge doesn't count. */
export function busyCells(cells: string[], minutes: number, busy: Busy[]): Set<string> {
  const out = new Set<string>();
  for (const cell of cells) {
    const from = Date.parse(cell);
    const to = from + minutes * 60_000;
    if (busy.some((b) => b.start < to && b.end > from)) out.add(cell);
  }
  return out;
}

async function busyFor(token: string, from: string, to: string): Promise<Busy[] | null> {
  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ timeMin: from, timeMax: to, items: [{ id: "primary" }] }),
    });
    if (res.status === 401 || res.status === 403) passes = passes.filter((p) => p.token !== token);
    return res.ok ? readBusy(await res.json()) : null;
  } catch {
    return null;
  }
}

/** Busy times for every Google account connected this visit, without asking anything. */
export async function busyFromConnected(from: string, to: string): Promise<Busy[] | null> {
  const mine = live();
  if (mine.length === 0) return null;
  const answers = await Promise.all(mine.map((p) => busyFor(p.token, from, to)));
  return answers.some((a) => a !== null) ? answers.flatMap((a) => a ?? []) : null;
}
