/**
 * Interview availability. The board edits this list; every window
 * is cut into back-to-back slots of `slotMinutes`.
 *
 * TODO(CORE): these windows are placeholders. Replace with real
 * board availability (or move to the database once there is one).
 */
export const interviewConfig = {
  timeZone: "America/New_York",
  slotMinutes: 20,
  /** Hours before a slot that booking/cancelling closes. */
  lockHours: 2,
};

/**
 * Who interviews. Each window below names one of them; their email
 * gets the calendar invite along with the student's.
 * TODO(CORE): put in the real addresses.
 */
export const interviewers = {
  dev: { name: "Dev", email: "" },
  rahul: { name: "Rahul", email: "" },
} as const;

export type InterviewerKey = keyof typeof interviewers;

export type InterviewWindow = {
  /** YYYY-MM-DD, in interviewConfig.timeZone */
  date: string;
  /** HH:MM, 24-hour */
  start: string;
  end: string;
  location: string;
  interviewer: InterviewerKey;
};

export const interviewWindows: InterviewWindow[] = [
  { date: "2026-12-01", start: "14:00", end: "16:00", location: "Lerner Hall", interviewer: "dev" },
  { date: "2026-12-02", start: "18:00", end: "20:00", location: "Zoom", interviewer: "rahul" },
  { date: "2026-12-03", start: "11:00", end: "13:00", location: "Lerner Hall", interviewer: "dev" },
  { date: "2026-12-04", start: "15:00", end: "17:00", location: "Zoom", interviewer: "rahul" },
  { date: "2026-12-07", start: "17:00", end: "19:00", location: "Lerner Hall", interviewer: "dev" },
];

export const interviewCopy = {
  length: "20 minutes",
  expect: [
    "Twenty minutes with someone from CORE. No case, no test.",
    "We'll talk about what you're good at, what you're into, and how you like to work.",
    "Nothing to prepare. The first thing that comes to mind is usually the right one.",
  ],
};
