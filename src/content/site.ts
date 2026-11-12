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
  // TODO: replace with the production domain once it is set up.
  url: "https://corefellowship.example.com",
  description:
    "CORE Fellowship matches Columbia students with early-stage startups through real conversations, not just resumes.",
};


export const applyLinks = {
  student: { label: "Apply as a Student", href: "/apply/student" },
  startup: { label: "Apply as a Startup", href: "/apply/startup" },
} as const;

export const heroContent = {
  title: "CORE Fellowship",
};
