/**
 * Copy for the How it works page. Keep it honest: no stats, partners,
 * timelines, or policies CORE hasn't confirmed.
 */
export const howIntro = {
  kicker: "How it works",
  title: "Great teams start with a conversation.",
  paragraphs: [
    "Recruiting season is built for big companies. Career fairs, online portals, a resume in a pile of hundreds. Early-stage startups don’t hire that way, and the students who’d thrive at one often get lost in it.",
    "So we do it by hand. CORE Fellowship gets to know Columbia students and startup founders as people, then puts the right ones in touch.",
  ],
};

export const howSteps = [
  {
    n: "01",
    title: "Tell us about yourself",
    body: "Students, tell us what you’ve built, what you’re studying, and the kind of work that makes you lose track of time. Founders, tell us what you’re building, who’s on the team, and the role you most need to fill.",
    aside: "No perfect resume required. We care about what you’ve done and where you want to go.",
  },
  {
    n: "02",
    title: "We get to know you",
    body: "Then we talk. A short conversation shows us how you think, what you care about, and how you like to work. For founders, it’s how we learn what the job really needs, beyond the title.",
    aside: "This is the part a job board can’t do.",
  },
  {
    n: "03",
    title: "Meet your match",
    body: "When we see a strong fit on both sides, we introduce you. A student meets a founder who needs exactly what they bring, and the two of you take it from there.",
    aside: "Every introduction is one we’d stand behind.",
  },
] as const;

export const howClosing = {
  title: "Your next chapter could start with one introduction.",
  body: "Whether you’re looking for your first startup role or your first great hire, we’d love to hear from you.",
};
