/**
 * Startups working with CORE that agreed to be shown (confirmed by Rahul,
 * Nov 2026). Logos live in /public/logos. Only add a company here once it has
 * agreed, since a logo reads as a partnership.
 *
 * The hero shows one fewer circle than there are logos, so each flip can swap
 * in the logo that's currently off screen without ever showing a duplicate.
 */
/** `fit: "contain"` pads logos whose artwork runs to the edges, so the circle never crops them. */
export type OrbitItem = { label: string; logo: string; href: string; fit?: "cover" | "contain" };

export const startups: OrbitItem[] = [
  { label: "Kalshi", logo: "/logos/kalshi.png", href: "https://kalshi.com" },
  { label: "Scoutify", logo: "/logos/scoutify.png", fit: "contain", href: "https://scoutify.com" },
  { label: "Vega", logo: "/logos/vega.png", href: "https://www.joinvega.com" },
  { label: "Enigma", logo: "/logos/enigma.png", href: "https://www.enigma.com" },
  { label: "Daps", logo: "/logos/daps.png", fit: "contain", href: "https://getdaps.io" },
  { label: "Omen", logo: "/logos/omen.png", href: "https://omen.trade" },
  { label: "Icon", logo: "/logos/icon.png", fit: "contain", href: "https://www.icon.com" },
  { label: "OneRange", logo: "/logos/onerange.png", href: "https://www.getrange.com" },
];

/** How many circles sit on each ring (total must be less than startups.length). */
export const ringSizes = { inner: 3, outer: 4 } as const;
