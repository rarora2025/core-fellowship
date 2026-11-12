/**
 * Circles that orbit the hero. Right now these are neutral sector icons.
 * Only add a startup's logo (`logo: "/logos/name.svg"`) once that company
 * has actually agreed to be shown, since a logo here reads as a partnership.
 */
export type OrbitItem = { label: string; icon: string; logo?: string };

export const innerRing: OrbitItem[] = [
  { label: "Fintech", icon: "wallet" },
  { label: "Climate", icon: "leaf" },
  { label: "Health", icon: "heart-pulse" },
  { label: "Developer tools", icon: "terminal" },
  { label: "AI", icon: "sparkles" },
  { label: "Hardware", icon: "cpu" },
  { label: "Consumer", icon: "shopping-bag" },
  { label: "Education", icon: "graduation-cap" },
];

export const outerRing: OrbitItem[] = [
  { label: "Markets", icon: "line-chart" },
  { label: "Robotics", icon: "bot" },
  { label: "Media", icon: "clapperboard" },
  { label: "Biotech", icon: "flask-conical" },
  { label: "Mobility", icon: "car" },
  { label: "Security", icon: "shield" },
  { label: "Real estate", icon: "building-2" },
  { label: "Space", icon: "rocket" },
  { label: "Food", icon: "utensils" },
  { label: "Gaming", icon: "gamepad-2" },
  { label: "Marketplaces", icon: "store" },
  { label: "Global", icon: "globe" },
];
