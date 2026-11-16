/**
 * Editable copy and option lists for the student application.
 * None of this is program policy: adjust freely as CORE decides.
 */

/** One question per screen, in this order. */
export const studentQuestions = [
  { field: "name", title: "What's your name?" },
  { field: "email", title: "What's your Columbia email?" },
  { field: "gradYear", title: "When do you graduate?" },
  { field: "major", title: "What are you studying?" },
  { field: "linkedin", title: "Where's your LinkedIn?" },
  { field: "resume", title: "Add your resume.", hint: "PDF, up to 5 MB." },
  { field: "skills", title: "What are you good at?", hint: "Pick a few or add your own." },
  { field: "interests", title: "What spaces are you into?" },
  { field: "roles", title: "What kind of role do you want?" },
  { field: "note", title: "Anything else we should know?", hint: "Optional." },
  { field: "referrals", title: "Who are the sharpest people you know?", hint: "Up to 5 friends you know well and would vouch for." },
] as const;

// TODO(CORE): confirm which schools count (Barnard, GS, grad schools, etc).
export const studentEmailDomains = ["columbia.edu"];

// TODO(CORE): confirm which class years are eligible.
export const gradYears = ["2026", "2027", "2028", "2029", "2030", "Grad student"];

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

export const noteMax = 600;

export const referralLimits = { min: 1, max: 5 };
