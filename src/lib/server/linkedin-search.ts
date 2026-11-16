import "server-only";

/**
 * Finds likely LinkedIn profiles through a web search API, not by
 * scraping LinkedIn (which their terms forbid and their site blocks).
 *
 * Set BRAVE_SEARCH_API_KEY to turn it on (https://brave.com/search/api/).
 * Without a key it reports itself unavailable and the form falls back to
 * pasting a link. LINKEDIN_SEARCH_MOCK=1 returns fake results for local UI work.
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
  return !!process.env.BRAVE_SEARCH_API_KEY || process.env.LINKEDIN_SEARCH_MOCK === "1";
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

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const q = `site:linkedin.com/in "${name.trim()}" Columbia ${major ?? ""}`.trim();
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?count=10&q=${encodeURIComponent(q)}`,
    { headers: { Accept: "application/json", "X-Subscription-Token": apiKey }, signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) return [];
  const body = (await res.json()) as {
    web?: { results?: { url: string; title: string; description?: string; thumbnail?: { src?: string } }[] };
  };

  const want = name.trim().toLowerCase().split(/\s+/);
  const seen = new Set<string>();
  const scored: (ProfileMatch & { score: number })[] = [];
  for (const r of body.web?.results ?? []) {
    const url = cleanUrl(r.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const { name: n, headline } = parseTitle(r.title);
    const text = `${r.title} ${r.description ?? ""}`.toLowerCase();
    let score = want.filter((w) => n.toLowerCase().includes(w)).length * 3;
    if (text.includes("columbia")) score += 3;
    if (major && text.includes(major.toLowerCase())) score += 2;
    if (gradYear && /^\d{4}$/.test(gradYear) && text.includes(gradYear)) score += 1;
    if (score < 3) continue;
    scored.push({ url, name: n, headline, photo: r.thumbnail?.src, score });
  }
  const results = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ url, name, headline, photo }) => ({ url, name, headline, photo }));
  cache.set(key, { at: Date.now(), results });
  return results;
}
