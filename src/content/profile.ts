/**
 * Editable copy and options for the student profile builder.
 *
 * The profile only collects structured, quick-to-answer things.
 * The deeper questions (what you're exceptional at, what you could
 * talk about for hours, how you work best) happen in the interview,
 * on purpose, so the answers stay unrehearsed.
 */
import { interestOptions, roleOptions, skillSuggestions } from "@/content/student-application";

export type ProfileQuestion = { field: string; title: string; hint?: string };

/** One question per screen, in this order. */
export const profileQuestions: readonly ProfileQuestion[] = [
  { field: "availability", title: "When could you work?", hint: "Pick all that apply." },
  { field: "roles", title: "What kind of work do you want?", hint: "Up to three." },
  { field: "interests", title: "Which spaces pull you in?", hint: "Up to three, or open to anything." },
  { field: "builderTypes", title: "How would you describe yourself?", hint: "Pick any that fit. None is fine too." },
  { field: "skills", title: "What tools do you use?", hint: "Add your own if it's missing." },
  { field: "fascinations", title: "What are you into outside class?", hint: "Just tags. Save the stories for the conversation." },
  { field: "environment", title: "Where do you do your best work?", hint: "No right answers. Go with your gut." },
];

// TODO(CORE): confirm which terms the Fellowship places for.
export const availabilityOptions = [
  "Spring 2027, part-time",
  "Summer 2027, full-time",
  "Summer 2027, part-time",
  "Fall 2027, part-time",
];

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
  { key: "place", left: "Remote", right: "In person" },
] as const;

export const profileLimits = { roles: 3, interests: 3, fascinations: 3, skills: 12 };
