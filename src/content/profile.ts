/**
 * Editable copy and options for the student profile builder.
 *
 * The profile only collects structured, quick-to-answer things.
 * The deeper questions (what you're exceptional at, what you could
 * talk about for hours, how you work best) happen in the interview,
 * on purpose, so the answers stay unrehearsed.
 */
import { interestOptions, roleOptions, skillSuggestions } from "@/content/student-application";

export type ProfileQuestion = { field: string; title: string; hint?: string; eyebrow?: string };

/**
 * One question per screen, in this order. The first two are logistics
 * and sit with the basics in the application; the rest are grouped
 * under three plain topic labels. The topics are named, never the
 * interview's own questions: those stay for the conversation.
 */
export const profileQuestions: readonly ProfileQuestion[] = [
  { field: "location", title: "Where could you work this summer?", hint: "Pick all that apply." },
  { field: "workAuth", title: "Can you work in the US without sponsorship?" },
  { field: "builderTypes", eyebrow: "What you're good at", title: "How would you describe yourself?", hint: "Pick any that fit." },
  { field: "skills", eyebrow: "What you're good at", title: "What are you fluent in?", hint: "Tools, languages, software. Add your own if it's missing." },
  { field: "roles", eyebrow: "What you're into", title: "What kind of work do you want?", hint: "Up to three." },
  { field: "interests", eyebrow: "What you're into", title: "Which spaces pull you in?", hint: "Up to three, or open to anything." },
  { field: "fascinations", eyebrow: "What you're into", title: "What are you into outside class?", hint: "Just tags." },
  { field: "environment", eyebrow: "How you like to work", title: "How do you like to work?", hint: "Go with your gut." },
  { field: "companySize", eyebrow: "How you like to work", title: "What size of company?" },
];

/** The two logistics questions, asked with the basics. */
export const basicsProfileFields = ["location", "workAuth"];

export const locationOptions = ["NYC, in person", "Remote", "Anywhere, I'd move"];

export const workAuthOptions = ["Yes", "I'm international (CPT/OPT)", "Not sure"];

export const companySizeOptions = ["Tiny (under 10)", "Growing (10–50)", "Bigger (50+)", "No preference"];

/** Shown once, just before the profile questions. */
export const profileIntro = {
  title: "Now the fun part.",
  hint: "A few quick taps about what you're good at, what you're into, and how you like to work. No writing.",
  button: "Let's go",
};

/** Shown after the application is in, on the way to booking. */
export const profileOutro = {
  title: "That's the outline.",
  hint: "We'll fill in the rest when we talk.",
  button: "Pick a time",
};

export const profileRoleOptions = roleOptions;
export const profileInterestOptions = interestOptions;
export const profileSkillOptions = skillSuggestions;

export const builderTypeOptions = ["Technical", "Creative", "Artist"];
export const builderTypeHints: Record<string, string> = {
  Technical: "You write code or work with data",
  Creative: "Writing, content, brand, storytelling",
  Artist: "Visual art, music, film, design",
};

export const fascinationOptions = [
  "Football",
  "Basketball",
  "Cars",
  "Music",
  "Film",
  "Fashion",
  "Food",
  "Gaming",
  "Fitness",
  "Travel",
  "Markets",
  "Politics",
  "Space",
  "Chess",
];

/** Each pair is a three-way choice: left, either, right. */
export const environmentPairs = [
  { key: "team", left: "Solo", right: "Team" },
  { key: "pace", left: "Structure", right: "Chaos" },
  { key: "setting", left: "At a desk", right: "On the move" },
] as const;

export const profileLimits = { roles: 3, interests: 3, fascinations: 3, skills: 12 };
