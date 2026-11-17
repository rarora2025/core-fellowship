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
  { field: "linkedin", title: "Which one is your LinkedIn?", hint: "Tap yours, or paste the link." },
  { field: "resume", title: "Can we see your resume?", hint: "Drop, paste or choose a PDF." },
  {
    field: "future",
    fields: ["skills", "interests", "roles"],
    title: "What does your future look like?",
    hint: "Say it however you like. We'll pull out the key words.",
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
  "Industrial Engineering and Operations Research",
  "Financial Engineering",
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

// Short names people actually type. Initials (CS, IEOR, BME) are matched automatically.
export const majorAliases: Record<string, string[]> = {
  "Computer Science": ["comp sci", "compsci", "coms"],
  Economics: ["econ"],
  "Financial Economics": ["fin econ", "finecon"],
  "Operations Research": ["or", "ops research"],
  "Industrial Engineering and Operations Research": ["ieor", "industrial engineering"],
  "Financial Engineering": ["fe", "fin eng", "ieor fe"],
  "Applied Mathematics": ["apam", "applied math"],
  Mathematics: ["math", "maths"],
  Statistics: ["stats", "stat"],
  "Political Science": ["poli sci", "polisci", "polysci"],
  "Neuroscience and Behavior": ["neuro", "nsb"],
  "Biomedical Engineering": ["bme", "biomed"],
  "Electrical Engineering": ["ee"],
  "Mechanical Engineering": ["meche", "mech e", "mech"],
  "Chemical Engineering": ["cheme", "chem e"],
  "Film and Media Studies": ["film"],
  Psychology: ["psych"],
  "Business (CBS)": ["cbs", "business", "mba"],
};

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
