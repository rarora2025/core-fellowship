/**
 * Editable copy and option lists for the student application.
 * None of this is program policy: adjust freely as CORE decides.
 */

/** One question per screen, in this order. */
export const studentQuestions = [
  { field: "gradYear", title: "When do you graduate?" },
  { field: "name", title: "What's your name?" },
  { field: "email", title: "What's your Columbia email?" },
  { field: "major", title: "What are you studying?", hint: "Search, or type your own." },
  { field: "linkedin", title: "Find your LinkedIn.", hint: "Tap yours, or paste the link." },
  { field: "resume", title: "Add your resume.", hint: "PDF, up to 5 MB." },
  {
    field: "future",
    fields: ["skills", "interests", "roles"],
    title: "What does your future look like?",
    hint: "What you're good at, the spaces you like, and the roles you want.",
  },
  { field: "referrals", title: "Who are the sharpest people you know?", hint: "Up to 5 friends you know well and would vouch for." },
] as const;

export type StudentQuestion = (typeof studentQuestions)[number];

// TODO(CORE): confirm which schools count (Barnard, GS, grad schools, etc).
export const studentEmailDomains = ["columbia.edu"];

// Suggestions for the major picker. People can still type anything.
export const majorOptions = [
  "Computer Science",
  "Economics",
  "Financial Economics",
  "Operations Research",
  "Applied Mathematics",
  "Mathematics",
  "Statistics",
  "Data Science",
  "Political Science",
  "Neuroscience and Behavior",
  "Biology",
  "Chemistry",
  "Physics",
  "Psychology",
  "Sociology",
  "Philosophy",
  "History",
  "English",
  "Urban Studies",
  "Architecture",
  "Film and Media Studies",
  "Sustainable Development",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Biomedical Engineering",
  "Industrial Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Business (CBS)",
  "Undeclared",
];

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

export const referralLimits = { min: 1, max: 5 };
