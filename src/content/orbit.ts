/**
 * Circles that orbit the hero: startups working with CORE that agreed to be
 * shown (confirmed by Rahul, Nov 2026). Logos live in /public/logos.
 * Only add a company here once it has agreed, since a logo reads as a partnership.
 */
export type OrbitItem = { label: string; logo: string; href: string };

export const innerRing: OrbitItem[] = [
  { label: "Kalshi", logo: "/logos/kalshi.png", href: "https://kalshi.com" },
  { label: "Scoutify", logo: "/logos/scoutify.png", href: "https://scoutify.com" },
  { label: "Vega", logo: "/logos/vega.png", href: "https://www.joinvega.com" },
  { label: "Enigma", logo: "/logos/enigma.png", href: "https://www.enigma.com" },
];

export const outerRing: OrbitItem[] = [
  { label: "Daps", logo: "/logos/daps.png", href: "https://getdaps.io" },
  { label: "Omen", logo: "/logos/omen.png", href: "https://omen.trade" },
  { label: "Icon", logo: "/logos/icon.png", href: "https://www.icon.com" },
  { label: "OneRange", logo: "/logos/onerange.png", href: "https://www.getrange.com" },
];
