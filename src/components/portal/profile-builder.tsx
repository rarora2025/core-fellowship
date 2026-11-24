"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileInput, profileFieldIsWide, profileFieldSkippable } from "@/components/portal/profile-inputs";
import { easeOutSoft } from "@/components/motion/easing";
import { portalCard } from "@/components/portal/ui";
import { environmentPairs, profileQuestions } from "@/content/profile";
import { checkProfileField, type ProfileField, type StudentProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

const INPUT_ID = "answer";

const iconButton =
  "grid size-10 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-300 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Profile builder: one question per screen, same motion and card as
 * the application. Saves after every step so nothing is lost.
 */
export function ProfileBuilder({
  initial,
  startAt = 0,
  review = false,
}: {
  initial: StudentProfile;
  startAt?: number;
  review?: boolean;
}) {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const [data, setData] = React.useState(initial);
  const [[index, direction], setPage] = React.useState<[number, 1 | -1]>([
    Math.min(Math.max(startAt, 0), profileQuestions.length - 1),
    1,
  ]);
  const [mode, setMode] = React.useState<"steps" | "review">(review ? "review" : "steps");
  // Editing one answer from the review screen returns to the review.
  const [fromReview, setFromReview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const question = profileQuestions[index];
  const field = question.field as ProfileField;
  const isLast = index === profileQuestions.length - 1;

  function set<K extends ProfileField>(key: K, value: StudentProfile[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  function goTo(i: number) {
    setError(null);
    setPage(([cur]) => [Math.min(Math.max(i, 0), profileQuestions.length - 1), i < cur ? -1 : 1]);
  }

  async function save(profile: StudentProfile) {
    const res = await fetch("/api/portal/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.status === 401) {
      router.push("/portal");
      throw new Error("signed out");
    }
    if (!res.ok) throw new Error(String(res.status));
  }

  async function next() {
    const msg = checkProfileField(field, data);
    if (msg) {
      setError(msg);
      document.getElementById(INPUT_ID)?.focus();
      return;
    }
    setSaving(true);
    try {
      await save(data);
    } catch {
      setSaving(false);
      setError("That didn't save. Check your connection and try again.");
      return;
    }
    setSaving(false);
    if (fromReview) {
      setFromReview(false);
      setMode("review");
      return;
    }
    if (isLast) {
      router.push("/portal");
      router.refresh();
      return;
    }
    goTo(index + 1);
  }

  const variants: Variants = {
    enter: (dir: number) => ({ opacity: 0, y: reduce ? 0 : dir * 24 }),
    center: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.2 : 0.7, ease: easeOutSoft, staggerChildren: reduce ? 0 : 0.06 },
    },
    exit: (dir: number) => ({
      opacity: 0,
      y: reduce ? 0 : dir * -18,
      transition: { duration: reduce ? 0.1 : 0.2, ease: [0.4, 0, 1, 1] },
    }),
  };
  const child: Variants = {
    enter: (dir: number) => ({ opacity: 0, y: reduce ? 0 : dir * 14 }),
    center: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.75, ease: easeOutSoft } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  if (mode === "review") {
    return (
      <Review
        data={data}
        onEdit={(i) => {
          setFromReview(true);
          setMode("steps");
          goTo(i);
        }}
      />
    );
  }

  const describedBy = error ? `${INPUT_ID}-error` : question.hint ? `${INPUT_ID}-hint` : undefined;
  const wide = profileFieldIsWide(field);

  return (
    <div className="w-full">
      <div className="fixed inset-x-0 top-16 z-30">
        <div className="h-[3px] bg-muted" aria-hidden="true">
          <motion.div
            className="h-full origin-left bg-cta"
            initial={false}
            animate={{ scaleX: (index + 1) / profileQuestions.length }}
            transition={{ duration: reduce ? 0 : 0.8, ease: easeOutSoft }}
          />
        </div>
        <div
          role="progressbar"
          aria-label="Profile progress"
          aria-valuemin={1}
          aria-valuemax={profileQuestions.length}
          aria-valuenow={index + 1}
          className="sr-only"
        />
        <nav className="flex h-14 items-center justify-between px-3 sm:px-6">
          {index > 0 ? (
            <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous question" className={iconButton}>
              <ArrowLeft className="size-[18px]" aria-hidden="true" />
            </button>
          ) : (
            <span className="size-10" />
          )}
          <Link href="/portal" aria-label="Back to portal" className={iconButton}>
            <X className="size-[18px]" aria-hidden="true" />
          </Link>
        </nav>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.form
          key={question.field}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
          className="flex w-full flex-col items-center text-center"
        >
          <motion.p variants={child} custom={direction} className="mb-3 text-[13px] text-subtle-foreground">
            {question.eyebrow ?? `${index + 1} of ${profileQuestions.length}`}
          </motion.p>
          <motion.h1
            variants={child}
            custom={direction}
            id="question"
            className="text-balance font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.7rem)] font-bold leading-[1.1] tracking-[-0.03em]"
          >
            {question.title}
          </motion.h1>
          {question.hint && (
            <motion.p
              variants={child}
              custom={direction}
              id={`${INPUT_ID}-hint`}
              className="mt-3 text-balance text-[15px] text-muted-foreground"
            >
              {question.hint}
            </motion.p>
          )}

          <motion.div
            variants={child}
            custom={direction}
            className={cn(portalCard, "mt-8 w-full p-2 text-left sm:mt-9", wide ? "max-w-[600px]" : "max-w-[520px]")}
          >
            <div className="px-2.5 pb-2.5 pt-2.5 sm:px-4 sm:pb-3 sm:pt-4">
              <ProfileInput
                field={field}
                data={data}
                set={set}
                onError={setError}
                describedBy={describedBy}
                invalid={!!error}
              />

              <p id={`${INPUT_ID}-error`} role="alert" className="min-h-5 px-1 pt-1.5 text-[13px] text-destructive">
                {error}
              </p>

              <Button type="submit" size="lg" variant="cta" className="mt-1 h-12 w-full rounded-xl" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving
                  </>
                ) : fromReview ? (
                  "Save"
                ) : isLast ? (
                  "Finish profile"
                ) : (
                  <>
                    {profileFieldSkippable(field, data) ? "Skip" : "Continue"}
                    <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const envLabel = (key: string, choice?: string) => {
  const pair = environmentPairs.find((p) => p.key === key)!;
  return choice === "left" ? pair.left : choice === "right" ? pair.right : choice === "either" ? `${pair.left} or ${pair.right}` : "";
};

function Review({ data, onEdit }: { data: StudentProfile; onEdit: (i: number) => void }) {
  const reduce = !!useReducedMotion();
  const rows = profileQuestions.map((q, i) => {
    const f = q.field as ProfileField;
    const value =
      f === "environment"
        ? environmentPairs.map((p) => envLabel(p.key, data.environment[p.key])).filter(Boolean)
        : (data[f] as string[]);
    return { i, title: q.title, value };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: easeOutSoft }}
      className="flex w-full flex-col items-center"
    >
      <h1 className="text-balance text-center font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.7rem)] font-bold leading-[1.1] tracking-[-0.03em]">
        Your profile
      </h1>
      <p className="mt-3 text-center text-[15px] text-muted-foreground">Saved. Tap any answer to change it.</p>
      <div className={cn(portalCard, "mt-9 w-full max-w-[600px] divide-y divide-border p-2")}>
        {rows.map((r) => (
          <button
            key={r.i}
            type="button"
            onClick={() => onEdit(r.i)}
            className="group flex w-full items-start justify-between gap-4 rounded-xl p-3.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:p-4"
          >
            <span className="min-w-0">
              <span className="block text-[13px] text-subtle-foreground">{r.title}</span>
              <span className="mt-1.5 flex flex-wrap gap-1.5">
                {r.value.length ? (
                  r.value.map((v) => (
                    <span key={v} className="rounded-full bg-columbia-soft px-2.5 py-0.5 text-[13px] text-columbia-ink dark:bg-brand/15 dark:text-foreground">
                      {v}
                    </span>
                  ))
                ) : (
                  <span className="text-[14px] text-muted-foreground">Skipped</span>
                )}
              </span>
            </span>
            <span className="shrink-0 pt-0.5 text-[13px] font-medium text-columbia-deep opacity-70 transition-opacity group-hover:opacity-100">
              Edit
            </span>
          </button>
        ))}
      </div>
      <Button asChild variant="cta" size="lg" className="mt-8 h-12 rounded-xl px-8">
        <Link href="/portal">Back to portal</Link>
      </Button>
    </motion.div>
  );
}
