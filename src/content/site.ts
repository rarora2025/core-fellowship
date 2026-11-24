/**
 * Central place for site copy and links.
 * Keep facts here so they can be edited (or later pulled from a CMS)
 * without touching components. Do not add stats, partners, or
 * policies that CORE has not confirmed.
 */
export const siteConfig = {
  name: "CORE Fellowship",
  shortName: "CORE",
  org: "Columbia Organization of Rising Entrepreneurs",
  // The live address. Set NEXT_PUBLIC_SITE_URL in Vercel once the domain is ready.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "CORE Fellowship matches Columbia students with early-stage startups through real conversations, not just resumes.",
};


export const applyLinks = {
  student: { label: "Apply as a Student", href: "/apply/student" },
} as const;

export const heroContent = {
  title: "CORE Fellowship",
};
