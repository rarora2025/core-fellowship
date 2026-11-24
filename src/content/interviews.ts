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

export type InterviewWindow = {
  /** YYYY-MM-DD, in interviewConfig.timeZone */
  date: string;
  /** HH:MM, 24-hour */
  start: string;
  end: string;
  location: string;
};

export const interviewWindows: InterviewWindow[] = [
  { date: "2026-12-01", start: "14:00", end: "16:00", location: "Lerner Hall" },
  { date: "2026-12-02", start: "18:00", end: "20:00", location: "Zoom" },
  { date: "2026-12-03", start: "11:00", end: "13:00", location: "Lerner Hall" },
  { date: "2026-12-04", start: "15:00", end: "17:00", location: "Zoom" },
  { date: "2026-12-07", start: "17:00", end: "19:00", location: "Lerner Hall" },
];

export const interviewCopy = {
  length: "20 minutes",
  expect: [
    "A relaxed conversation with someone from CORE. No case, no technical test.",
    "We'll talk about what people come to you for, what you could talk about for hours, and where you do your best work.",
    "Nothing to prepare. We'd rather hear the real version than a rehearsed one.",
  ],
};
