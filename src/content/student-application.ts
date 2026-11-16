/**
 * Editable copy and option lists for the student application.
 * None of this is program policy: adjust freely as CORE decides.
 */

export const studentSteps = [
  { key: "about", title: "About you", intro: "The basics, so we know who we're talking to." },
  { key: "experience", title: "Your experience", intro: "Where you've been and what you're good at." },
  { key: "goals", title: "What you want", intro: "Help us find a startup you'd actually be excited about." },
  { key: "review", title: "Review", intro: "Take a quick look before you send it." },
] as const;

export type StudentStepKey = (typeof studentSteps)[number]["key"];

// TODO(CORE): confirm which schools count (Barnard, GS, grad schools, etc).
export const studentEmailDomains = ["columbia.edu"];

// TODO(CORE): confirm which class years are eligible.
export const gradYears = ["2027", "2028", "2029", "2030", "Graduate student"];

export const skillSuggestions = [
  "Python",
  "TypeScript",
  "React",
  "SQL",
  "Machine learning",
  "iOS",
  "Figma",
  "User research",
  "Financial modeling",
  "Excel",
  "Writing",
  "Sales",
];

export const interestOptions = [
  "AI",
  "Fintech",
  "Climate",
  "Health",
  "Consumer",
  "Developer tools",
  "Education",
  "Media",
  "Marketplaces",
  "Hardware",
  "Crypto",
  "Open to anything",
];

export const roleOptions = [
  "Software engineering",
  "Product",
  "Design",
  "Data",
  "Growth and marketing",
  "Operations",
  "Sales and partnerships",
  "Finance",
  "Research",
];

export const resumeRules = {
  maxBytes: 5 * 1024 * 1024,
  types: ["application/pdf"],
  label: "PDF, up to 5 MB",
};

export const lookingForMax = 800;
