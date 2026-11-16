import "server-only";

/**
 * Finds likely LinkedIn profiles for an applicant from their name,
 * Columbia and major.
 *
 * LinkedIn profile pages sit behind a login wall for servers, so we read
 * public search results instead: DuckDuckGo's plain HTML results page by
 * default (no key needed), or the Brave Search API if BRAVE_SEARCH_API_KEY
 * is set. Search pages can rate limit or change their markup; when that
 * happens this returns nothing and the form falls back to pasting a link.
 *
 * LINKEDIN_SEARCH=off disables it. LINKEDIN_SEARCH_MOCK=1 returns fake
 * results for local UI work.
 */
export type ProfileMatch = {
  url: string;
  name: string;
  headline: string;
  photo?: string;
};

type Query = { name: string; gradYear?: string; major?: string };

const cache = new Map<string, { at: number; results: ProfileMatch[] }>();

export function linkedinSearchAvailable() {
  return process.env.LINKEDIN_SEARCH !== "off";
}

type Raw = { url: string; title: string; description: string; photo?: string };

async function braveResults(q: string, apiKey: string): Promise<Raw[]> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?count=10&q=${encodeURIComponent(q)}`,
    { headers: { Accept: "application/json", "X-Subscription-Token": apiKey }, signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) return [];
  const body = (await res.json()) as {
    web?: { results?: { url: string; title: string; description?: string; thumbnail?: { src?: string } }[] };
  };
  return (body.web?.results ?? []).map((r) => ({
    url: r.url,
    title: r.title,
    description: r.description ?? "",
    photo: r.thumbnail?.src,
  }));
}

function decodeEntities(s: string) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Bing wraps result links as bing.com/ck/a?...&u=a1<base64url of the real URL>. */
function unwrapBing(href: string) {
  try {
    const u = new URL(href, "https://www.bing.com");
    const enc = u.searchParams.get("u");
    if (u.hostname.endsWith("bing.com") && enc?.startsWith("a1")) {
      return Buffer.from(enc.slice(2).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    }
  } catch {}
  return href;
}

/** Reads Bing's results page. Used when DuckDuckGo is rate limiting. */
async function bingResults(q: string): Promise<Raw[]> {
  const res = await fetch(`https://www.bing.com/search?count=15&setlang=en-US&q=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": BROWSER_UA, Accept: "text/html", "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(7000),
  });
  if (res.status !== 200) return [];
  const html = await res.text();
  const out: Raw[] = [];
  const blocks = html.split('<li class="b_algo"').slice(1, 13);
  for (const b of blocks) {
    const a = b.match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    const p = b.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    out.push({ url: unwrapBing(decodeEntities(a[1])), title: decodeEntities(a[2]), description: decodeEntities(p?.[1] ?? "") });
  }
  return out;
}

/** Reads DuckDuckGo's no-JavaScript results page. */
async function duckDuckGoResults(q: string): Promise<Raw[]> {
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": BROWSER_UA,
      Accept: "text/html",
    },
    body: new URLSearchParams({ q, kl: "us-en" }).toString(),
    signal: AbortSignal.timeout(7000),
  });
  // DuckDuckGo answers 202 with a challenge page when it's rate limiting.
  if (res.status !== 200) return [];
  const html = await res.text();
  const out: Raw[] = [];
  const link = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const hits = [...html.matchAll(link)];
  hits.slice(0, 12).forEach((m, i) => {
    const end = hits[i + 1]?.index ?? html.length;
    const chunk = html.slice(m.index! + m[0].length, end);
    const snippet = chunk.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "";
    let href = decodeEntities(m[1]);
    const uddg = href.match(/[?&]uddg=([^&]+)/);
    if (uddg) href = decodeURIComponent(uddg[1]);
    if (href.startsWith("//")) href = `https:${href}`;
    out.push({ url: href, title: decodeEntities(m[2]), description: decodeEntities(snippet) });
  });
  return out;
}

function cleanUrl(raw: string) {
  try {
    const u = new URL(raw);
    const m = u.pathname.match(/^\/in\/([^/]+)/);
    return m ? `https://www.linkedin.com/in/${m[1]}` : null;
  } catch {
    return null;
  }
}

function parseTitle(title: string) {
  const t = title.replace(/\s*[|·-]\s*LinkedIn\s*$/i, "").replace(/<[^>]+>/g, "");
  const [name, ...rest] = t.split(/\s+[-–|]\s+/);
  return { name: name.trim(), headline: rest.join(" · ").trim() };
}

export async function searchLinkedIn({ name, gradYear, major }: Query): Promise<ProfileMatch[]> {
  const key = [name, gradYear, major].map((s) => (s ?? "").trim().toLowerCase()).join("|");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60 * 60 * 1000) return hit.results;

  if (process.env.LINKEDIN_SEARCH_MOCK === "1") {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "");
    return [
      { url: `https://www.linkedin.com/in/${slug}`, name, headline: `${major || "Student"} at Columbia University` },
      { url: `https://www.linkedin.com/in/${slug}-2`, name, headline: "Analyst · New York" },
    ];
  }

  const q = `site:linkedin.com/in "${name.trim()}" Columbia ${major ?? ""}`.trim();
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  let raw: Raw[] = [];
  if (apiKey) raw = await braveResults(q, apiKey).catch(() => []);
  if (!raw.length) raw = await duckDuckGoResults(q).catch(() => []);
  if (!raw.length) raw = await bingResults(q).catch(() => []);
  // A looser try if the strict query finds nothing.
  if (!raw.length) raw = await bingResults(`${name.trim()} Columbia University linkedin`).catch(() => []);

  const want = name.trim().toLowerCase().split(/\s+/);
  const seen = new Set<string>();
  const scored: (ProfileMatch & { score: number; columbia: boolean })[] = [];
  for (const r of raw) {
    const url = cleanUrl(r.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const { name: n, headline } = parseTitle(r.title);
    const text = `${r.title} ${r.description}`.toLowerCase();
    let score = want.filter((w) => n.toLowerCase().includes(w)).length * 3;
    const columbia = /columbia|barnard/.test(text);
    if (columbia) score += 3;
    if (major && text.includes(major.toLowerCase())) score += 2;
    if (gradYear && /^\d{4}$/.test(gradYear) && text.includes(gradYear)) score += 1;
    if (score < 3) continue;
    scored.push({ url, name: n, headline, photo: r.photo, score, columbia });
  }
  // Prefer people tied to Columbia; only fall back to everyone if none are.
  const pool = scored.some((m) => m.columbia) ? scored.filter((m) => m.columbia) : scored;
  const results = pool
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ url, name, headline, photo }) => ({ url, name, headline, photo }));
  if (results.length) cache.set(key, { at: Date.now(), results });
  return results;
}
