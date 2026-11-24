import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CopyLink } from "@/components/portal/copy-link";
import { portalCard, portalTitle } from "@/components/portal/ui";
import { applyLinks } from "@/content/site";
import { profileQuestions } from "@/content/profile";
import { formatSlot, placeOf } from "@/lib/interviews";
import { isAnswered, profileProgress, type ProfileField } from "@/lib/profile";
import { bookingFor, currentStudent, readProfile } from "@/lib/server/portal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHome({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const { link } = await searchParams;
  const me = await currentStudent();

  if (!me) {
    return (
      <main id="main" className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[560px] flex-col items-center justify-center px-5 text-center">
        <h1 className={portalTitle}>{link === "invalid" ? "That link didn't work." : "Your portal opens after you apply."}</h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          {link === "invalid"
            ? "Use the private link from when you applied, or reach out and we'll send it again."
            : "Once you've applied, you can build your profile and book your conversation here."}
        </p>
        <Button asChild variant="cta" size="lg" className="mt-9 h-12 rounded-xl px-8">
          <Link href={applyLinks.student.href}>
            Apply as a student
            <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
          </Link>
        </Button>
      </main>
    );
  }

  const [profile, booking] = await Promise.all([readProfile(me.id), bookingFor(me.id)]);
  const progress = profileProgress(profile);
  const first = me.name.trim().split(/\s+/)[0];
  const nextQuestion = profileQuestions.findIndex((q) => !isAnswered(q.field as ProfileField, profile));

  // Applying builds the profile, so there are two steps: the profile, then the conversation.
  const steps = [
    { label: "Profile", done: progress.complete, note: progress.complete ? "Done" : `${progress.done} of ${progress.total}` },
    { label: "Conversation", done: !!booking, note: booking ? "Booked" : "Not booked yet" },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-[680px] px-5 pb-20 pt-12 sm:pt-16">
      <h1 className={portalTitle}>{first ? `Hi, ${first}.` : "Your portal"}</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        {booking
          ? "You're all set. You can change your profile or your time here."
          : progress.complete
            ? "One thing left: pick a time to talk with us."
            : "Two things to do here: finish your profile, then pick a time to talk with us."}
      </p>

      <ol className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px]" aria-label="Your progress">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full",
                s.done ? "bg-cta text-cta-foreground" : "border border-input text-transparent"
              )}
              aria-hidden="true"
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span className="font-medium">{s.label}</span>
            <span className="text-subtle-foreground">{s.note}</span>
          </li>
        ))}
      </ol>

      <div className={cn(portalCard, "mt-6 divide-y divide-border p-2")}>
        <section className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium tracking-[-0.01em]">Your profile</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              {progress.complete
                ? "What you're looking for and how you like to work. You can change it any time."
                : "Quick taps, no essays. About two minutes."}
            </p>
            {!progress.complete && (
              <div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-cta" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
            )}
          </div>
          <Button asChild variant={progress.complete ? "outline" : "cta"} size="lg" className="h-11 shrink-0 rounded-xl px-5">
            <Link href={progress.complete ? "/portal/profile?review=1" : `/portal/profile?step=${Math.max(nextQuestion, 0)}`}>
              {progress.complete ? "Edit profile" : progress.done ? "Continue" : "Start"}
            </Link>
          </Button>
        </section>

        <section className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <h2 className="text-[17px] font-medium tracking-[-0.01em]">Your conversation</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              {booking ? (
                <>
                  <span className="text-foreground">{formatSlot(booking)}</span>
                  <span className="block">{placeOf(booking).label}</span>
                </>
              ) : (
                "Twenty minutes with someone from CORE. No case, no test."
              )}
            </p>
          </div>
          <Button asChild variant={booking ? "outline" : "cta"} size="lg" className="h-11 shrink-0 rounded-xl px-5">
            <Link href="/portal/interview">{booking ? "Change time" : "Book a time"}</Link>
          </Button>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-1.5 text-[13.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Signed in as <span className="text-foreground">{me.email}</span>
        </span>
        <CopyLink path={`/portal/enter?key=${me.token}`} />
      </div>
      <p className="mt-2 text-[13px] text-subtle-foreground">
        Your private link is how you get back in on another device. Keep it to yourself.
      </p>
    </main>
  );
}
