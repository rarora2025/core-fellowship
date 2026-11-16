/**
 * Student application shape and validation. Shared by the form
 * (client) and the API route (server), so the rules live in one place.
 */
import {
  referralLimits,
  resumeRules,
  studentEmailDomains,
} from "@/content/student-application";

export type Referral = { name: string; email: string };

export type ResumeMeta = { id?: string; name: string; size: number; type: string; pages?: number };

export type StudentApplication = {
  name: string;
  email: string;
  gradYear: string;
  major: string;
  linkedin: string;
  resume: ResumeMeta | null;
  skills: string[];
  interests: string[];
  roles: string[];
  referrals: Referral[];
};

export type StudentField = keyof StudentApplication;
export type StudentErrors = Partial<Record<StudentField, string>>;

export const emptyStudentApplication: StudentApplication = {
  name: "",
  email: "",
  gradYear: "",
  major: "",
  linkedin: "",
  resume: null,
  skills: [],
  interests: [],
  roles: [],
  referrals: [],
};

export const studentFields: StudentField[] = [
  "name", "email", "gradYear", "major", "linkedin", "resume", "skills", "interests", "roles", "referrals",
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isSchoolEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return studentEmailDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function normalizeLinkedIn(value: string) {
  const v = value.trim();
  if (!v) return v;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function isLinkedInUrl(value: string) {
  try {
    const url = new URL(normalizeLinkedIn(value));
    return /(^|\.)linkedin\.com$/i.test(url.hostname) && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function checkField(field: StudentField, a: StudentApplication): string | undefined {
  switch (field) {
    case "name":
      return a.name.trim() ? undefined : "Add your full name.";
    case "email":
      if (!EMAIL.test(a.email.trim())) return "Enter a valid email.";
      return isSchoolEmail(a.email)
        ? undefined
        : `Use your ${studentEmailDomains.map((d) => `@${d}`).join(" or ")} email.`;
    case "gradYear":
      return a.gradYear ? undefined : "Pick one.";
    case "major":
      return a.major.trim() ? undefined : "Add your major, or what you plan to study.";
    case "linkedin":
      if (!a.linkedin.trim()) return "Add your LinkedIn profile.";
      return isLinkedInUrl(a.linkedin) ? undefined : "That doesn't look like a LinkedIn profile link.";
    case "resume":
      if (!a.resume) return "Upload your resume to continue.";
      if (!resumeRules.types.includes(a.resume.type)) return "Resumes need to be a PDF.";
      return a.resume.size <= resumeRules.maxBytes ? undefined : "That file is over 5 MB.";
    case "skills":
      return a.skills.length ? undefined : "Pick or add at least one skill.";
    case "interests":
      return a.interests.length ? undefined : "Pick at least one area.";
    case "roles":
      return a.roles.length ? undefined : "Pick at least one kind of role.";
    case "referrals": {
      const filled = a.referrals.filter((r) => r.name.trim() || r.email.trim());
      if (filled.length < referralLimits.min) return "Add at least one person.";
      if (filled.length > referralLimits.max) return `Up to ${referralLimits.max} people.`;
      const bad = filled.findIndex((r) => !r.name.trim() || !EMAIL.test(r.email.trim()));
      if (bad >= 0) return `Add a name and a valid email for person ${bad + 1}.`;
      const emails = filled.map((r) => r.email.trim().toLowerCase());
      if (emails.includes(a.email.trim().toLowerCase())) return "That's your own email. Add someone else.";
      if (new Set(emails).size !== emails.length) return "Each person needs a different email.";
      return undefined;
    }
  }
}

export function validateFields(fields: StudentField[], a: StudentApplication): StudentErrors {
  const errors: StudentErrors = {};
  for (const f of fields) {
    const msg = checkField(f, a);
    if (msg) errors[f] = msg;
  }
  return errors;
}

export function validateStudentApplication(a: StudentApplication) {
  return validateFields(studentFields, a);
}
