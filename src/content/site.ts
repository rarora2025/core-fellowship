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

export const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Students", href: "/#students" },
  { label: "Startups", href: "/#startups" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const applyLinks = {
  student: { label: "Apply as a Student", href: "/apply/student" },
  startup: { label: "Apply as a Startup", href: "/apply/startup" },
} as const;

export const heroContent = {
  kicker: "Columbia Organization of Rising Entrepreneurs",
  kickerRight: "For Columbia students and early-stage startups",
  headline:
    "Connecting Columbia’s most ambitious students with startups building what’s next.",
  lede:
    "Tell us what you’re great at and what you want to learn. We’ll get to know you, then introduce you to founders who need someone exactly like you.",
};
