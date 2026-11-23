"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResumeUpload } from "@/components/apply/resume-upload";
import { LinkedInFinder } from "@/components/apply/linkedin-finder";
import { MajorPicker, resolveMajor } from "@/components/apply/text-pickers";
import { WheelPicker } from "@/components/apply/wheel-picker";
import { easeOutSoft } from "@/components/motion/easing";
import {
  gradYears,
  referralLimits,
  studentQuestions,
  type StudentQuestion,
} from "@/content/student-application";
import {
  emptyStudentApplication,
  isSchoolEmail,
  normalizeLinkedIn,
  validateFields,
  validateStudentApplication,
  type Referral,
  type StudentApplication,
  type StudentField,
} from "@/lib/applications/student";
import { suggestEmail } from "@/lib/email-typos";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "core:student-application";
const INPUT_ID = "answer";

type Draft = { data: StudentApplication; index: number };
type Setter = <K extends StudentField>(key: K, value: StudentApplication[K]) => void;

/** Merge a stored draft onto a fresh application, dropping anything malformed. */
function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    const data = { ...emptyStudentApplication };
    for (const key of Object.keys(data) as StudentField[]) {
      const value = parsed.data?.[key];
      const fallback = emptyStudentApplication[key];
      const sameShape =
        Array.isArray(fallback) ? Array.isArray(value) : key === "resume" ? value && typeof value === "object" : typeof value === typeof fallback;
      if (sameShape) (data as Record<string, unknown>)[key] = value;
    }
    const index = Math.min(Math.max(Number(parsed.index) || 0, 0), studentQuestions.length - 1);
    return { data, index };
  } catch {
    return null;
  }
}

function writeDraft(d: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

function fieldsOf(q: StudentQuestion): StudentField[] {
  return [q.field as StudentField];
}

const iconButton =
  "grid size-10 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-300 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

const cardClass =
  "w-full rounded-[22px] border border-border bg-card p-2 shadow-[0_1px_2px_rgb(var(--shadow-color)/0.05),0_24px_48px_-24px_rgb(var(--shadow-color)/0.25)]";

/**
 * Student application, one question per screen, in the same card and
 * type as the homepage. Moving forward rises in from below; going
 * back plays the same motion in reverse.
 */
export function StudentApplicationForm({ initialEmail = "" }: { initialEmail?: string }) {
  const reduce = !!useReducedMotion();
  const [[index, direction], setPage] = React.useState<[number, 1 | -1]>([0, 1]);
  const [data, setData] = React.useState<StudentApplication>({ ...emptyStudentApplication, email: initialEmail });
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setData({ ...draft.data, email: initialEmail || draft.data.email });
      setPage([draft.index, 1]);
    }
    setHydrated(true);
  }, [initialEmail]);

  React.useEffect(() => {
    if (hydrated && status !== "sent") writeDraft({ data, index });
  }, [data, index, hydrated, status]);

  // Skip the email question when the homepage already gave us a school email.
  const questions = React.useMemo(
    () => (isSchoolEmail(initialEmail) ? studentQuestions.filter((q) => q.field !== "email") : studentQuestions),
    [initialEmail]
  );
  const question = questions[Math.min(index, questions.length - 1)];
  const field = question.field as StudentField;
  const fields = fieldsOf(question);
  const [, setErrorField] = React.useState<StudentField | null>(null);
  const isLast = index >= questions.length - 1;

  const set: Setter = React.useCallback((key, value) => {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  }, []);

  function goTo(i: number) {
    setError(null);
    setErrorField(null);
    setPage(([cur]) => [Math.min(Math.max(i, 0), questions.length - 1), i < cur ? -1 : 1]);
  }

  async function submit(final: StudentApplication) {
    const tidy = { ...final, referrals: final.referrals.filter((r) => r.name.trim() || r.email.trim()) };
    const errs = validateStudentApplication(tidy);
    const firstBad = questions.findIndex((q) => fieldsOf(q).some((f) => errs[f]));
    if (firstBad >= 0) {
      const f = fieldsOf(questions[firstBad]).find((k) => errs[k])!;
      goTo(firstBad);
      setError(errs[f] ?? null);
      setErrorField(f);
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/applications/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tidy),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 422 && body.errors) {
        setStatus("idle");
        const bad = questions.findIndex((q) => fieldsOf(q).some((f) => body.errors[f]));
        if (bad >= 0) {
          const f = fieldsOf(questions[bad]).find((k) => body.errors[k])!;
          goTo(bad);
          setError(body.errors[f]);
          setErrorField(f);
        }
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      clearDraft();
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  function next(current = data) {
    const errs = validateFields(fields, current);
    const bad = fields.find((f) => errs[f]);
    if (bad) {
      setError(errs[bad]!);
      setErrorField(bad);
      document.getElementById(INPUT_ID)?.focus();
      return;
    }
    let value = current;
    if (field === "linkedin") {
      value = { ...current, linkedin: normalizeLinkedIn(current.linkedin) };
      setData(value);
    }
    if (field === "major") {
      value = { ...current, major: resolveMajor(current.major) };
      setData(value);
    }
    if (isLast) return void submit(value);
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

  if (status === "sent") {
    const first = data.name.trim().split(/\s+/)[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 20, filter: reduce ? "none" : "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: easeOutSoft }}
        className="flex flex-col items-center text-center"
      >
        <motion.span
          initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: easeOutSoft, delay: 0.2 }}
          className="mb-7 grid size-14 place-items-center rounded-full bg-cta text-cta-foreground"
        >
          <Check className="size-6" strokeWidth={2.5} aria-hidden="true" />
        </motion.span>
        <h1 className="font-display text-[clamp(2rem,1.5rem+1.8vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.03em]">
          Thanks{first ? `, ${first}` : ""}.
        </h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          We got your application and will reach out at <span className="text-foreground">{data.email}</span>.
        </p>
        <Button asChild variant="cta" size="lg" className="mt-10 h-12 rounded-xl px-8">
          <Link href="/">Back home</Link>
        </Button>
      </motion.div>
    );
  }

  const describedBy = error ? `${INPUT_ID}-error` : question.hint ? `${INPUT_ID}-hint` : undefined;
  const textField = field === "name" || field === "email";

  return (
    <div className="w-full">
      <div className="fixed inset-x-0 top-0 z-50">
        <div className="h-[3px] bg-muted" aria-hidden="true">
          <motion.div
            className="h-full origin-left bg-cta"
            initial={false}
            animate={{ scaleX: (index + 1) / questions.length }}
            transition={{ duration: reduce ? 0 : 0.8, ease: easeOutSoft }}
          />
        </div>
        <div
          role="progressbar"
          aria-label="Application progress"
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-valuenow={index + 1}
          className="sr-only"
        />
        <nav className="flex h-14 items-center justify-between px-3 sm:px-6">
          <AnimatePresence initial={false}>
            {index > 0 ? (
              <motion.button
                key="back"
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous question"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.4, ease: easeOutSoft }}
                className={iconButton}
              >
                <ArrowLeft className="size-[18px]" aria-hidden="true" />
              </motion.button>
            ) : (
              <span key="spacer" className="size-10" />
            )}
          </AnimatePresence>
          <Link href="/" aria-label="Close application" className={iconButton}>
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

          <motion.div variants={child} custom={direction} className={cn(cardClass, "mt-8 text-left sm:mt-9", field === "referrals" ? "max-w-[540px]" : "max-w-[460px]")}>
            <div className="px-2.5 pb-2.5 pt-2.5 sm:px-4 sm:pb-3 sm:pt-4">
              {textField && (
                <Input
                  id={INPUT_ID}
                  autoFocus
                  aria-labelledby="question"
                  aria-invalid={!!error}
                  aria-describedby={describedBy}
                  value={data[field as "name" | "email"]}
                  onChange={(e) => set(field as "name" | "email", e.target.value)}
                  enterKeyHint="next"
                  {...(field === "name" && { autoComplete: "name", placeholder: "First and last" })}
                  {...(field === "email" && {
                    type: "email",
                    inputMode: "email" as const,
                    autoComplete: "email",
                    autoCapitalize: "none",
                    placeholder: "you@columbia.edu",
                  })}
                />
              )}

              {field === "gradYear" && (
                <WheelPicker
                  id={INPUT_ID}
                  labelledBy="question"
                  describedBy={describedBy}
                  options={gradYears}
                  value={data.gradYear}
                  defaultIndex={1}
                  onChange={(v) => set("gradYear", v)}
                />
              )}

              {field === "major" && (
                <MajorPicker value={data.major} onChange={(v) => set("major", v)} describedBy={describedBy} invalid={!!error} />
              )}

              {field === "linkedin" && (
                <LinkedInFinder
                  name={data.name}
                  gradYear={data.gradYear}
                  major={data.major}
                  value={data.linkedin}
                  onChange={(v) => set("linkedin", v)}
                  describedBy={describedBy}
                  invalid={!!error}
                />
              )}

              {field === "resume" && (
                <ResumeUpload id={INPUT_ID} value={data.resume} onChange={(r) => set("resume", r)} onError={setError} describedBy={describedBy} />
              )}

              {field === "referrals" && (
                <Referrals value={data.referrals} ownEmail={data.email} onChange={(v) => set("referrals", v)} describedBy={describedBy} />
              )}

              <p id={`${INPUT_ID}-error`} role="alert" className="min-h-5 px-1 pt-1.5 text-[13px] text-destructive">
                {error ?? (status === "failed" ? "That didn't go through. Your answers are still here, so try again." : null)}
              </p>

              <Button
                type="submit"
                size="lg"
                variant="cta"
                className="mt-1 h-12 w-full rounded-xl"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending
                  </>
                ) : isLast ? (
                  field === "referrals" && !data.referrals.some((r) => r.name.trim() || r.email.trim())
                    ? "Skip and submit"
                    : "Submit application"
                ) : (
                  <>
                    Continue
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

/* ------------------------------------------------------------------ */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailCheck =
  | { state: "checking" }
  | { state: "ok"; suggestion: string | null }
  | { state: "bad"; suggestion: string | null };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Gravatar photo when the person has one, otherwise their initials. */
function Avatar({ name, email, index }: { name: string; email: string; index: number }) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setLoaded(false);
    const clean = email.trim().toLowerCase();
    if (!EMAIL_SHAPE.test(clean) || !globalThis.crypto?.subtle) {
      setSrc(null);
      return;
    }
    const t = window.setTimeout(async () => {
      const hash = await sha256(clean);
      if (alive) setSrc(`https://gravatar.com/avatar/${hash}?s=96&d=404`);
    }, 500);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [email]);

  const letters = initials(name);
  return (
    <span className="relative mt-1.5 grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-cta text-[13px] font-semibold text-cta-foreground">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={letters || index}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.35, ease: easeOutSoft }}
          className="tabular-nums"
        >
          {letters || index + 1}
        </motion.span>
      </AnimatePresence>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setSrc(null)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </span>
  );
}

/** Checks a friend's email as it's typed: it has to be a Columbia address. */
function checkEmail(email: string): EmailCheck | null {
  const clean = email.trim();
  if (!EMAIL_SHAPE.test(clean)) return null;
  if (isSchoolEmail(clean)) return { state: "ok", suggestion: null };
  const fix = suggestEmail(clean);
  return { state: "bad", suggestion: fix && isSchoolEmail(fix) ? fix : null };
}

function ReferralRow({
  index,
  ownEmail,
  value,
  onChange,
  onRemove,
  onEnterLast,
  nameRef,
}: {
  index: number;
  ownEmail: string;
  value: Referral;
  onChange: (patch: Partial<Referral>) => void;
  onRemove?: () => void;
  onEnterLast?: () => void;
  nameRef?: React.Ref<HTMLInputElement>;
}) {
  const isSelf = !!ownEmail && value.email.trim().toLowerCase() === ownEmail.trim().toLowerCase();
  const check: EmailCheck | null = isSelf ? { state: "bad", suggestion: null } : checkEmail(value.email);
  const suggestion = check && check.state !== "checking" ? check.suggestion : null;

  return (
    <div className="rounded-xl bg-muted/60 p-2">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <Avatar name={value.name} email={value.email} index={index} />
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <Input
            ref={nameRef}
            id={index === 0 ? INPUT_ID : undefined}
            autoFocus={index === 0 && !value.name}
            aria-label={`Person ${index + 1} name`}
            placeholder="Name"
            autoComplete="off"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-11 bg-card"
          />
          <div className="relative">
            <Input
              aria-label={`Person ${index + 1} email`}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="uni@columbia.edu"
              value={value.email}
              aria-invalid={check?.state === "bad" || undefined}
              onChange={(e) => onChange({ email: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && onEnterLast && value.name && value.email) {
                  e.preventDefault();
                  onEnterLast();
                }
              }}
              className="h-11 bg-card pr-9"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait" initial={false}>
                {check?.state === "checking" && (
                  <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 className="size-4 animate-spin text-subtle-foreground" aria-hidden="true" />
                  </motion.span>
                )}
                {check?.state === "ok" && !suggestion && (
                  <motion.span
                    key="ok"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: easeOutSoft }}
                  >
                    <Check className="size-4 text-cta" aria-label="Email looks good" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            aria-label={`Remove person ${index + 1}`}
            onClick={onRemove}
            className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {(suggestion || check?.state === "bad") && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: easeOutSoft }}
            className="overflow-hidden pl-12 text-[13px] sm:pl-[52px]"
            aria-live="polite"
          >
            <span className="block pb-1 pt-2">
              {suggestion ? (
                <>
                  <span className="text-muted-foreground">Did you mean </span>
                  <button
                    type="button"
                    onClick={() => onChange({ email: suggestion })}
                    className="font-medium text-cta underline-offset-4 hover:underline"
                  >
                    {suggestion}
                  </button>
                  <span className="text-muted-foreground">?</span>
                </>
              ) : (
                <span className="text-destructive">
                  {isSelf ? "That's you. Add someone else." : "Use their @columbia.edu email."}
                </span>
              )}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Referrals({
  value,
  ownEmail,
  onChange,
  describedBy,
}: {
  value: Referral[];
  ownEmail: string;
  onChange: (v: Referral[]) => void;
  describedBy?: string;
}) {
  const rows = value.length ? value : [{ name: "", email: "" }];
  const canAdd = rows.length < referralLimits.max;
  const lastNameRef = React.useRef<HTMLInputElement>(null);
  const [focusNew, setFocusNew] = React.useState(false);

  React.useEffect(() => {
    if (focusNew) {
      lastNameRef.current?.focus();
      setFocusNew(false);
    }
  }, [focusNew, rows.length]);

  function add() {
    if (!canAdd) return;
    onChange([...rows, { name: "", email: "" }]);
    setFocusNew(true);
  }

  return (
    <div role="group" aria-labelledby="question" aria-describedby={describedBy}>
      <ol className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {rows.map((r, i) => (
            <motion.li
              key={i}
              layout
              initial={{ opacity: 0, height: 0, y: 8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.55, ease: easeOutSoft }}
              className="overflow-hidden"
            >
              <ReferralRow
                index={i}
                ownEmail={ownEmail}
                value={r}
                nameRef={i === rows.length - 1 ? lastNameRef : undefined}
                onChange={(patch) => onChange(rows.map((row, j) => (j === i ? { ...row, ...patch } : row)))}
                onRemove={rows.length > 1 ? () => onChange(rows.filter((_, j) => j !== i)) : undefined}
                onEnterLast={i === rows.length - 1 && canAdd ? add : undefined}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {canAdd && (
        <motion.button
          layout
          type="button"
          onClick={add}
          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add another
          <span className="tabular-nums text-subtle-foreground">
            ({rows.length}/{referralLimits.max})
          </span>
        </motion.button>
      )}
    </div>
  );
}
