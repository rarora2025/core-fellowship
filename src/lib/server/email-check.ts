import "server-only";

import { resolveMx } from "node:dns/promises";

const cache = new Map<string, { ok: boolean; at: number }>();
const DAY = 24 * 60 * 60 * 1000;

let dnsCheck: { ok: boolean; at: number } | null = null;

async function dnsWorks() {
  if (dnsCheck && Date.now() - dnsCheck.at < 10 * 60 * 1000) return dnsCheck.ok;
  let ok = false;
  try {
    ok = (await resolveMx("gmail.com")).length > 0;
  } catch {}
  dnsCheck = { ok, at: Date.now() };
  return ok;
}

/**
 * True when the domain publishes mail servers (MX records), which
 * means the address can at least receive email. It can't tell whether
 * a specific inbox exists; nothing reliable can without emailing it.
 * Unexpected DNS failures count as ok so a hiccup never blocks anyone.
 */
export async function domainAcceptsMail(domain: string) {
  const d = domain.trim().toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return false;
  const hit = cache.get(d);
  if (hit && Date.now() - hit.at < DAY) return hit.ok;

  let ok = true;
  try {
    const mx = await Promise.race([
      resolveMx(d),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (mx !== null) ok = mx.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    // Only trust a "no such domain" answer if DNS works at all here.
    ok = !((code === "ENOTFOUND" || code === "ENODATA") && (await dnsWorks()));
  }
  cache.set(d, { ok, at: Date.now() });
  return ok;
}
