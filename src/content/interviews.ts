/**
 * Interview settings. The times themselves are set on the board's
 * Schedule tab and kept in the database (interview_windows); every
 * free block is cut into back-to-back slots of `slotMinutes`.
 */
export const interviewConfig = {
  timeZone: "America/New_York",
  slotMinutes: 20,
  /** Hours before a slot that booking/cancelling closes. */
  lockHours: 2,
  /** The hours the Schedule grid shows, in New York time. */
  dayStart: "08:00",
  dayEnd: "22:00",
  /** Where an in-person block happens unless someone types another room. */
  defaultRoom: "Lerner Hall",
};

/** Who runs the interviews. Both are on every one and get every invite. */
export const team = [
  { name: "Dev", email: "dg3592@columbia.edu" },
  { name: "Rahul", email: "ra3206@columbia.edu" },
] as const;

/**
 * One shared set of CORE interview times ("core"). Kept as a key so a
 * second calendar could be added later without changing the database.
 */
export const interviewers = {
  core: { name: "CORE", emails: team.map((t) => t.email) },
} as const;

export type InterviewerKey = keyof typeof interviewers;

/** A block of free time: cut into slots, booked by students. */
export type InterviewWindow = {
  interviewer: InterviewerKey;
  /** ISO instants */
  start: string;
  end: string;
  /** A room for in person, or a Google Meet link (https://meet.google.com/…) for online. */
  location: string;
};

export const interviewCopy = {
  length: "20 minutes",
  expect: [
    "Twenty minutes with someone from CORE. No case, no test.",
    "We use this conversation to introduce you to startups.",
    "We'll talk about what you're good at, what you're into, and how you like to work.",
    "Nothing to prepare. The first thing that comes to mind is usually the right one.",
  ],
};
