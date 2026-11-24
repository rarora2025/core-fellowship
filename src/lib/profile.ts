/**
 * Student profile shape and validation. Shared by the builder
 * (client) and the API route (server).
 */
import {
  builderTypeOptions,
  companySizeOptions,
  environmentPairs,
  locationOptions,
  profileLimits,
  profileQuestions,
  workAuthOptions,
} from "@/content/profile";

export type EnvironmentChoice = "left" | "either" | "right";
export type EnvironmentKey = (typeof environmentPairs)[number]["key"];

export type StudentProfile = {
  location: string[];
  /** One answer, kept as a list so every field is a list of strings. */
  workAuth: string[];
  companySize: string[];
  roles: string[];
  interests: string[];
  builderTypes: string[];
  skills: string[];
  fascinations: string[];
  environment: Partial<Record<EnvironmentKey, EnvironmentChoice>>;
};

export type ProfileField = keyof StudentProfile;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export const emptyProfile: StudentProfile = {
  location: [],
  workAuth: [],
  companySize: [],
  roles: [],
  interests: [],
  builderTypes: [],
  skills: [],
  fascinations: [],
  environment: {},
};

export const profileFields = profileQuestions.map((q) => q.field as ProfileField);

/** Fields that need an answer before the step counts as done. */
const required: ProfileField[] = ["location", "workAuth", "roles", "interests", "environment", "companySize"];

const CHOICES: EnvironmentChoice[] = ["left", "either", "right"];

function strings(v: unknown, max: number, len = 40): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== "string") continue;
    const s = x.trim().slice(0, len);
    if (s && !out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Coerce anything (stored JSON, request body) into a clean profile. */
export function sanitizeProfile(input: unknown): StudentProfile {
  const p = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const env = (p.environment && typeof p.environment === "object" ? p.environment : {}) as Record<string, unknown>;
  const environment: StudentProfile["environment"] = {};
  for (const { key } of environmentPairs) {
    const c = env[key];
    if (typeof c === "string" && CHOICES.includes(c as EnvironmentChoice)) environment[key] = c as EnvironmentChoice;
  }
  return {
    location: strings(p.location, 3).filter((a) => locationOptions.includes(a)),
    workAuth: strings(p.workAuth, 1).filter((a) => workAuthOptions.includes(a)),
    companySize: strings(p.companySize, 4).filter((a) => companySizeOptions.includes(a)),
    roles: strings(p.roles, profileLimits.roles),
    interests: strings(p.interests, profileLimits.interests),
    builderTypes: strings(p.builderTypes, 3).filter((b) => builderTypeOptions.includes(b)),
    skills: strings(p.skills, profileLimits.skills),
    fascinations: strings(p.fascinations, profileLimits.fascinations, 30),
    environment,
  };
}

export function checkProfileField(field: ProfileField, p: StudentProfile): string | undefined {
  switch (field) {
    case "location":
      return p.location.length ? undefined : "Pick at least one.";
    case "workAuth":
      return p.workAuth.length ? undefined : "Pick one.";
    case "companySize":
      return p.companySize.length ? undefined : "Pick at least one, or “No preference”.";
    case "roles":
      return p.roles.length ? undefined : "Pick at least one.";
    case "interests":
      return p.interests.length ? undefined : "Pick at least one, or “Open to anything”.";
    case "environment":
      return environmentPairs.every(({ key }) => p.environment[key])
        ? undefined
        : "Answer each row. “Either” is a fine answer.";
    default:
      return undefined;
  }
}

/** True once a question has been answered (optional ones count once touched). */
export function isAnswered(field: ProfileField, p: StudentProfile) {
  if (required.includes(field)) return !checkProfileField(field, p);
  const v = p[field];
  return Array.isArray(v) ? v.length > 0 : false;
}

/** The first question that still needs an answer, or -1 when all are done. */
export function firstMissing(p: StudentProfile) {
  return profileFields.findIndex((f) => !!checkProfileField(f, p));
}

export function profileProgress(p: StudentProfile) {
  const done = required.filter((f) => isAnswered(f, p)).length;
  return { done, total: required.length, complete: done === required.length };
}
