"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, FileText, Loader2, Plus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup } from "@/components/apply/chip-group";
import { easeOutSoft } from "@/components/motion/easing";
import {
  gradYears,
  interestOptions,
  noteMax,
  referralLimits,
  resumeRules,
  roleOptions,
  skillSuggestions,
  studentQuestions,
} from "@/content/student-application";
import {
  emptyStudentApplication,
  normalizeLinkedIn,
  validateFields,
  validateStudentApplication,
  type Referral,
  type ResumeMeta,
  type StudentApplication,
  type StudentField,
} from "@/lib/applications/student";
import { looksLikePdf } from "@/lib/pdf";
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
  const advanceTimer = React.useRef<number | undefined>(undefined);

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

  React.useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const question = studentQuestions[index];
  const field = question.field as StudentField;
  const isLast = index === studentQuestions.length - 1;

  const set: Setter = React.useCallback((key, value) => {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  }, []);

  function goTo(i: number) {
    window.clearTimeout(advanceTimer.current);
    setError(null);
    setPage(([cur]) => [Math.min(Math.max(i, 0), studentQuestions.length - 1), i < cur ? -1 : 1]);
  }

  async function submit(final: StudentApplication) {
    const tidy = { ...final, referrals: final.referrals.filter((r) => r.name.trim() || r.email.trim()) };
    const errs = validateStudentApplication(tidy);
    const firstBad = studentQuestions.findIndex((q) => errs[q.field as StudentField]);
    if (firstBad >= 0) {
      goTo(firstBad);
      setError(errs[studentQuestions[firstBad].field as StudentField] ?? null);
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
        const bad = studentQuestions.findIndex((q) => body.errors[q.field]);
        if (bad >= 0) {
          goTo(bad);
          setError(body.errors[studentQuestions[bad].field]);
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
    const errs = validateFields([field], current);
    if (errs[field]) {
      setError(errs[field]!);
      document.getElementById(INPUT_ID)?.focus();
      return;
    }
    let value = current;
    if (field === "linkedin") {
      value = { ...current, linkedin: normalizeLinkedIn(current.linkedin) };
      setData(value);
    }
    if (isLast) return void submit(value);
    goTo(index + 1);
  }

  const variants: Variants = {
    enter: (dir: number) => ({ opacity: 0, y: reduce ? 0 : dir * 28, filter: reduce ? "none" : "blur(6px)" }),
    center: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduce ? 0.2 : 0.9, ease: easeOutSoft, staggerChildren: reduce ? 0 : 0.09 },
    },
    exit: (dir: number) => ({
      opacity: 0,
      y: reduce ? 0 : dir * -18,
      filter: reduce ? "none" : "blur(4px)",
      transition: { duration: reduce ? 0.1 : 0.32, ease: [0.4, 0, 1, 1] },
    }),
  };
  const child: Variants = {
    enter: (dir: number) => ({ opacity: 0, y: reduce ? 0 : dir * 14 }),
    center: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.9, ease: easeOutSoft } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
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
        <Button asChild variant="outline" className="mt-10">
          <Link href="/">Back home</Link>
        </Button>
      </motion.div>
    );
  }

  const describedBy = error ? `${INPUT_ID}-error` : "hint" in question ? `${INPUT_ID}-hint` : undefined;
  const textField = field === "name" || field === "email" || field === "major" || field === "linkedin";
  const autoAdvance = field === "gradYear";
  const optionalEmpty = field === "note" && !data.note.trim();

  return (
    <div className="w-full">
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
          <motion.p variants={child} custom={direction} className="mb-4 text-[13px] tabular-nums text-subtle-foreground">
            {index + 1} of {studentQuestions.length}
          </motion.p>
          <motion.h1
            variants={child}
            custom={direction}
            id="question"
            className="text-balance font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.7rem)] font-bold leading-[1.1] tracking-[-0.03em]"
          >
            {question.title}
          </motion.h1>
          {"hint" in question && (
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
                  value={data[field]}
                  onChange={(e) => set(field, e.target.value)}
                  enterKeyHint="next"
                  {...(field === "name" && { autoComplete: "name", placeholder: "First and last" })}
                  {...(field === "email" && {
                    type: "email",
                    inputMode: "email" as const,
                    autoComplete: "email",
                    autoCapitalize: "none",
                    placeholder: "you@columbia.edu",
                  })}
                  {...(field === "major" && { placeholder: "Computer Science" })}
                  {...(field === "linkedin" && {
                    type: "url",
                    inputMode: "url" as const,
                    autoCapitalize: "none",
                    placeholder: "linkedin.com/in/yourname",
                  })}
                />
              )}

              {field === "gradYear" && (
                <ChipGroup
                  id={INPUT_ID}
                  single
                  labelledBy="question"
                  describedBy={describedBy}
                  options={gradYears}
                  value={data.gradYear ? [data.gradYear] : []}
                  onChange={([v]) => {
                    const updated = { ...data, gradYear: v };
                    set("gradYear", v);
                    window.clearTimeout(advanceTimer.current);
                    advanceTimer.current = window.setTimeout(() => next(updated), reduce ? 0 : 420);
                  }}
                />
              )}

              {(field === "skills" || field === "interests" || field === "roles") && (
                <ChipGroup
                  id={INPUT_ID}
                  labelledBy="question"
                  describedBy={describedBy}
                  options={field === "skills" ? skillSuggestions : field === "interests" ? interestOptions : roleOptions}
                  value={data[field]}
                  onChange={(v) => set(field, v)}
                  allowCustom={field === "skills"}
                  customPlaceholder="Add a skill"
                />
              )}

              {field === "resume" && (
                <ResumeUpload value={data.resume} onChange={(r) => set("resume", r)} onError={setError} describedBy={describedBy} />
              )}

              {field === "note" && (
                <Textarea
                  id={INPUT_ID}
                  autoFocus
                  aria-labelledby="question"
                  aria-describedby={describedBy}
                  aria-invalid={!!error}
                  placeholder="A project you're proud of, a startup you love, anything."
                  value={data.note}
                  maxLength={noteMax}
                  onChange={(e) => set("note", e.target.value)}
                  className="min-h-28"
                />
              )}

              {field === "referrals" && (
                <Referrals value={data.referrals} onChange={(v) => set("referrals", v)} describedBy={describedBy} />
              )}

              <p id={`${INPUT_ID}-error`} role="alert" className="min-h-5 px-1 pt-1.5 text-[13px] text-destructive">
                {error ?? (status === "failed" ? "That didn't go through. Your answers are still here, so try again." : null)}
              </p>

              {!autoAdvance && (
                <Button
                  type="submit"
                  size="lg"
                  variant={optionalEmpty ? "outline" : "cta"}
                  className="mt-1 h-12 w-full rounded-xl"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Sending
                    </>
                  ) : isLast ? (
                    "Submit application"
                  ) : optionalEmpty ? (
                    "Skip"
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
          {index > 0 && (
            <motion.div variants={child} custom={direction} className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                className="group inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] text-muted-foreground outline-none transition-colors duration-300 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <ArrowLeft
                  className="size-4 transition-transform duration-300 ease-out-soft group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                Back
              </button>
            </motion.div>
          )}
        </motion.form>
      </AnimatePresence>

    </div>
  );
}

/* ------------------------------------------------------------------ */

function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Picks (or takes a dropped) PDF, checks it in the browser, then
 * uploads it right away with a progress bar. The server checks it
 * again and stores it, returning an id the application points to.
 */
function ResumeUpload({
  value,
  onChange,
  onError,
  describedBy,
}: {
  value: ResumeMeta | null;
  onChange: (r: ResumeMeta | null) => void;
  onError: (msg: string | null) => void;
  describedBy?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const xhr = React.useRef<XMLHttpRequest | null>(null);

  React.useEffect(() => () => xhr.current?.abort(), []);

  async function take(file: File | undefined) {
    if (!file) return;
    onError(null);
    if (file.size > resumeRules.maxBytes) return onError("That file is over 5 MB.");
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!looksLikePdf(head)) return onError("That file isn't a PDF. Export your resume as a PDF and try again.");

    const body = new FormData();
    body.set("file", file);
    const req = new XMLHttpRequest();
    xhr.current = req;
    setProgress(0);
    req.upload.onprogress = (e) => e.lengthComputable && setProgress(e.loaded / e.total);
    req.onload = () => {
      let res: { ok?: boolean; error?: string; resume?: ResumeMeta } = {};
      try {
        res = JSON.parse(req.responseText);
      } catch {}
      setProgress(null);
      if (req.status >= 200 && req.status < 300 && res.resume) onChange(res.resume);
      else onError(res.error ?? "Upload failed. Try again.");
    };
    req.onerror = () => {
      setProgress(null);
      onError("Upload failed. Check your connection and try again.");
    };
    req.open("POST", "/api/uploads/resume");
    req.send(body);
  }

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        take(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (progress !== null) {
    return (
      <div className="flex h-[132px] flex-col items-center justify-center gap-4 rounded-xl border border-input px-6" aria-live="polite">
        <span className="text-[14px] text-muted-foreground">Uploading</span>
        <div className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full origin-left rounded-full bg-cta"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(progress, 0.06) }}
            transition={{ duration: 0.4, ease: easeOutSoft }}
          />
        </div>
      </div>
    );
  }

  if (value?.id) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: easeOutSoft }}
        className="flex items-center gap-3 rounded-xl border border-input p-3"
      >
        {picker}
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-columbia-soft text-columbia-deep">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-medium">{value.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <Check className="size-3.5 text-cta" aria-hidden="true" />
            Uploaded · {formatBytes(value.size)}
            {value.pages ? ` · ${value.pages} ${value.pages === 1 ? "page" : "pages"}` : ""}
          </span>
        </span>
        <button
          id={INPUT_ID}
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Replace
        </button>
        <button
          type="button"
          aria-label="Remove resume"
          onClick={() => onChange(null)}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <>
      {picker}
      <button
        id={INPUT_ID}
        type="button"
        autoFocus
        aria-labelledby="question"
        aria-describedby={describedBy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex h-[132px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground outline-none transition-[border-color,background-color,color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
          dragging ? "border-cta bg-columbia-soft text-foreground" : "border-input hover:border-columbia hover:text-foreground"
        )}
      >
        <span className="grid size-10 place-items-center rounded-full bg-columbia-soft text-columbia-deep">
          <Upload className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="text-[14.5px]">
          <span className="font-medium text-foreground">Choose a PDF</span>
          <span className="hidden sm:inline"> or drop it here</span>
        </span>
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Referrals({
  value,
  onChange,
  describedBy,
}: {
  value: Referral[];
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

  function update(i: number, patch: Partial<Referral>) {
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

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
              <div className="flex items-start gap-2.5 rounded-xl bg-muted/60 p-2 sm:gap-3">
                <span className="mt-3 grid size-6 shrink-0 place-items-center rounded-full bg-cta text-[12px] font-semibold tabular-nums text-cta-foreground">
                  {i + 1}
                </span>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <Input
                    ref={i === rows.length - 1 ? lastNameRef : undefined}
                    id={i === 0 ? INPUT_ID : undefined}
                    autoFocus={i === 0 && !r.name}
                    aria-label={`Person ${i + 1} name`}
                    placeholder="Name"
                    autoComplete="off"
                    value={r.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    className="h-11 bg-card"
                  />
                  <Input
                    aria-label={`Person ${i + 1} email`}
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="off"
                    placeholder="Email"
                    value={r.email}
                    onChange={(e) => update(i, { email: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && i === rows.length - 1 && canAdd && r.name && r.email) {
                        e.preventDefault();
                        add();
                      }
                    }}
                    className="h-11 bg-card"
                  />
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove person ${i + 1}`}
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    className="mt-2 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
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
