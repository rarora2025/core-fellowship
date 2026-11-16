/** Catches the usual domain typos ("gmial.com", "columbia.edy"). */
const KNOWN = [
  "columbia.edu",
  "barnard.edu",
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "me.com",
  "nyu.edu",
];

function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Returns a corrected email if the domain is one or two letters off a common one. */
export function suggestEmail(email: string) {
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!local || !domain || KNOWN.includes(domain)) return null;
  const sub = KNOWN.find((k) => domain.endsWith(`.${k}`));
  if (sub) return null;
  let best: string | null = null;
  let bestD = 3;
  for (const k of KNOWN) {
    const d = distance(domain, k);
    if (d < bestD) {
      best = k;
      bestD = d;
    }
  }
  return best ? `${local}@${best}` : null;
}
