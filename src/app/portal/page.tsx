import Link from "next/link";
import { ArrowRight, CalendarPlus, Check, Pencil } from "lucide-react";

import { CoreBulb } from "@/components/brand/core-bulb";
import { Marker } from "@/components/hero/hand-drawn";
import { BookingTicket } from "@/components/portal/booking-ticket";
import { CopyLink } from "@/components/portal/copy-link";
import { portalCard, portalTitle, ticketButton } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { profileQuestions } from "@/content/profile";
import { applyLinks } from "@/content/site";
import { isAnswered, profileProgress, type ProfileField } from "@/lib/profile";
import { bookingFor, currentStudent, readProfile } from "@/lib/server/portal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const chip = "rounded-full bg-columbia-soft px-2.5 py-0.5 text-[13px] text-columbia-ink dark:bg-brand/15 dark:text-foreground";

function Tags({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="grid gap-1.5 sm:grid-cols-[110px_1fr] sm:gap-3">
      <dt className="pt-0.5 text-[13px] text-subtle-foreground">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className={chip}>
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

export default async function PortalHome({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { link } = await searchParams;
  const me = await currentStudent();

  if (!me) {
    return (
      <main id="main" className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[560px] flex-col items-center justify-center px-5 text-center">
        <span className="mb-7 grid size-16 place-items-center rounded-[20px] bg-cta text-white">
          <CoreBulb className="h-9 w-auto" />
        </span>
        <h1 className={portalTitle}>{link === "invalid" ? "That link didn't work." : "Your portal opens after you apply."}</h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          {link === "invalid"
            ? "Use the private link from when you applied, or reach out and we'll send it again."
            : "Apply in about four minutes, then book your conversation here."}
        </p>
        <Button asChild variant="cta" size="lg" className="mt-9 h-12 rounded-xl px-8">
          <Link href={applyLinks.student.href}>
            Start your application
            <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
          </Link>
        </Button>
      </main>
    );
  }

  const [profile, booking] = await Promise.all([readProfile(me.id), bookingFor(me.id)]);
  const progress = profileProgress(profile);
  const raw = me.name.trim().split(/\s+/)[0] ?? "";
  const first = raw ? raw[0].toUpperCase() + raw.slice(1) : "";
  const nextQuestion = profileQuestions.findIndex((q) => !isAnswered(q.field as ProfileField, profile));

  // Applying builds the profile, so there are two steps: the profile, then the conversation.
  const steps = [
    { label: "Profile", done: progress.complete },
    { label: "Conversation", done: !!booking },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-[680px] px-5 pb-20 pt-12 sm:pt-16">
      <h1 className={cn(portalTitle, "isolate")}>
        {first ? (
          <>
            Hi, <Marker delay={0.3}>{first}</Marker>.
          </>
        ) : (
          "Your portal"
        )}
      </h1>
      <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
        {booking
          ? "You're all set. We use this conversation to introduce you to startups."
          : progress.complete
            ? "One thing left: pick a time to talk with us."
            : "Two things to do: finish your profile, then pick a time to talk."}
      </p>

      {/* Two steps, joined */}
      <ol className="mt-7 flex items-center gap-3 text-[14px]" aria-label="Your progress">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true" className={cn("h-px w-8 sm:w-14", steps[i - 1].done ? "bg-cta" : "bg-border")} />}
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-[12px] font-semibold",
                  s.done ? "bg-cta text-white" : "border border-input text-muted-foreground"
                )}
              >
                {s.done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span className={s.done ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
              <span className="sr-only">{s.done ? "done" : "to do"}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* The conversation */}
      {booking ? (
        <BookingTicket slot={booking} className="mt-8">
          <a href="/api/portal/interview/ics" className={ticketButton.primary}>
            <CalendarPlus className="size-4" aria-hidden="true" />
            Add to calendar
          </a>
          <Link href="/portal/interview?change=1" className={ticketButton.outline}>
            Change time
          </Link>
        </BookingTicket>
      ) : (
        <section className={cn(portalCard, "relative mt-8 overflow-hidden p-6 sm:p-7")} aria-label="Your conversation">
          <CoreBulb className="pointer-events-none absolute -right-2 -top-3 h-32 w-auto text-cta/15" />
          <h2 className="relative font-display text-[22px] font-bold tracking-[-0.02em]">Pick a time to talk</h2>
          <p className="relative mt-1.5 max-w-sm text-[14.5px] leading-relaxed text-muted-foreground">
            Twenty minutes with someone from CORE. No case, no test.
          </p>
          <Button asChild variant="cta" size="lg" className="relative mt-5 h-11 rounded-xl px-6">
            <Link href="/portal/interview">
              Book a time
              <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
            </Link>
          </Button>
        </section>
      )}

      {/* The profile */}
      <section className={cn(portalCard, "mt-4 p-6 sm:p-7")} aria-labelledby="profile-heading">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="profile-heading" className="text-[17px] font-medium tracking-[-0.01em]">
              Your profile
            </h2>
            {!progress.complete && (
              <p className="mt-1 text-[14px] text-muted-foreground">
                {progress.done} of {progress.total} answered. Quick taps, no essays.
              </p>
            )}
          </div>
          <Button asChild variant={progress.complete ? "outline" : "cta"} className="h-10 shrink-0 rounded-full px-4">
            <Link href={progress.complete ? "/portal/profile?review=1" : `/portal/profile?step=${Math.max(nextQuestion, 0)}`}>
              {progress.complete ? (
                <>
                  <Pencil className="size-3.5" />
                  Edit
                </>
              ) : (
                "Continue"
              )}
            </Link>
          </Button>
        </div>
        {progress.complete ? (
          <dl className="mt-5 grid gap-2.5">
            <Tags label="Wants to do" values={profile.roles} />
            <Tags label="Spaces" values={profile.interests} />
            <Tags label="Fluent in" values={profile.skills} />
            <Tags label="Outside class" values={profile.fascinations} />
          </dl>
        ) : (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-cta" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
      </section>

      {/* Getting back in */}
      <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-muted/60 px-5 py-4 text-[13.5px] sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">
          Signed in as <span className="text-foreground">{me.email}</span>
        </span>
        <CopyLink path={`/portal/enter?key=${me.token}`} />
      </div>
      <p className="mt-2 px-1 text-[13px] text-subtle-foreground">Your private link gets you back in on another device. Keep it to yourself.</p>
    </main>
  );
}
