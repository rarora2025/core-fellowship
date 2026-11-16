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
  { field: "resume", title: "Got a resume?", hint: "Optional. PDF, up to 5 MB." },
  { field: "skills", title: "What are you good at?", hint: "Pick a few or add your own." },
  { field: "interests", title: "What spaces are you into?" },
  { field: "roles", title: "What kind of role do you want?" },
  { field: "lookingFor", title: "What are you hoping to find?", hint: "An internship, part time work, something to learn. Whatever's true." },
] as const;

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
