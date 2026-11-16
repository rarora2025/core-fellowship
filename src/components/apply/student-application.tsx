"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup } from "@/components/apply/chip-group";
import { easeOutSoft } from "@/components/motion/easing";
import {
  gradYears,
  interestOptions,
  lookingForMax,
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
  type StudentApplication,
  type StudentField,
} from "@/lib/applications/student";

const DRAFT_KEY = "core:student-application";
const INPUT_ID = "answer";

type Draft = { data: StudentApplication; index: number };

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(d: Draft) {
  try {
    // A file can't be kept in storage, so the resume is left out.
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, data: { ...d.data, resume: null } }));
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
 * Student application, one question per screen. Same card and type
 * as the homepage so it reads as one continuous thing.
 */
export function StudentApplicationForm({ initialEmail = "" }: { initialEmail?: string }) {
  const reduce = !!useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [data, setData] = React.useState<StudentApplication>({ ...emptyStudentApplication, email: initialEmail });
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [hydrated, setHydrated] = React.useState(false);
  const advanceTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const draft = loadDraft();
    if (draft?.data) {
      setData((d) => ({ ...d, ...draft.data, email: initialEmail || draft.data.email || d.email, resume: null }));
      const resumeAt = studentQuestions.findIndex((q) => q.field === "resume");
      setIndex(Math.min(draft.index ?? 0, resumeAt));
    }
    setHydrated(true);
  }, [initialEmail]);

  React.useEffect(() => {
    if (hydrated && status !== "sent") saveDraft({ data, index });
  }, [data, index, hydrated, status]);

  React.useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const question = studentQuestions[index];
  const field = question.field as StudentField;
  const isLast = index === studentQuestions.length - 1;

  function set<K extends StudentField>(key: K, value: StudentApplication[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  async function submit(final: StudentApplication) {
    const errs = validateStudentApplication(final);
    const firstBad = studentQuestions.findIndex((q) => errs[q.field as StudentField]);
    if (firstBad >= 0) {
      setIndex(firstBad);
      setError(errs[studentQuestions[firstBad].field as StudentField] ?? null);
      return;
    }
    setStatus("sending");
    try {
      const body = new FormData();
      body.set("data", JSON.stringify({ ...final, resume: null }));
      if (file) body.set("resume", file);
      const res = await fetch("/api/applications/student", { method: "POST", body });
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
    setError(null);
    setIndex((i) => i + 1);
  }

  function back() {
    window.clearTimeout(advanceTimer.current);
    setError(null);
    setStatus("idle");
    setIndex((i) => Math.max(i - 1, 0));
  }

  const enter = {
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 1.1, ease: easeOutSoft } },
    exit: { opacity: 0, y: reduce ? 0 : -10, transition: { duration: reduce ? 0.1 : 0.35, ease: easeOutSoft } },
  };

  if (status === "sent") {
    const first = data.name.trim().split(/\s+/)[0];
    return (
      <motion.div {...enter} className="flex flex-col items-center text-center">
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
  const textField = (field === "name" || field === "email" || field === "major" || field === "linkedin") as boolean;
  const resumeSkippable = field === "resume" && !file;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.form
        key={question.field}
        {...enter}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        className="flex w-full flex-col items-center text-center"
      >
        <h1
          id="question"
          className="font-display text-[clamp(1.9rem,1.4rem+1.8vw,2.7rem)] font-bold leading-[1.1] tracking-[-0.03em]"
        >
          {question.title}
        </h1>
        {"hint" in question && (
          <p id={`${INPUT_ID}-hint`} className="mt-3 text-[15px] text-muted-foreground">
            {question.hint}
          </p>
        )}

        <div className={`${cardClass} mt-9 max-w-[440px] text-left`}>
          <div className="px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
            {textField && (
              <Input
                id={INPUT_ID}
                autoFocus
                aria-labelledby="question"
                aria-invalid={!!error}
                aria-describedby={describedBy}
                value={data[field as "name" | "email" | "major" | "linkedin"]}
                onChange={(e) => set(field as "name", e.target.value)}
                {...(field === "name" && { autoComplete: "name", placeholder: "First and last" })}
                {...(field === "email" && {
                  type: "email",
                  inputMode: "email" as const,
                  autoComplete: "email",
                  placeholder: "you@columbia.edu",
                })}
                {...(field === "major" && { placeholder: "Computer Science" })}
                {...(field === "linkedin" && {
                  type: "url",
                  inputMode: "url" as const,
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
                  advanceTimer.current = window.setTimeout(() => next(updated), reduce ? 0 : 380);
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

            {field === "resume" && <ResumePicker file={file} setFile={setFile} set={set} />}

            {field === "lookingFor" && (
              <Textarea
                id={INPUT_ID}
                autoFocus
                aria-labelledby="question"
                aria-invalid={!!error}
                aria-describedby={describedBy}
                value={data.lookingFor}
                maxLength={lookingForMax}
                onChange={(e) => set("lookingFor", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    next();
                  }
                }}
              />
            )}

            <p id={`${INPUT_ID}-error`} role="alert" className="min-h-5 pt-1.5 text-[13px] text-destructive">
              {error ?? (status === "failed" ? "That didn't go through. Your answers are still here, so try again." : null)}
            </p>

            {field !== "gradYear" && (
              <Button
                type="submit"
                size="lg"
                variant={resumeSkippable ? "outline" : "default"}
                className="mt-1 w-full rounded-xl"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending
                  </>
                ) : isLast ? (
                  "Submit application"
                ) : resumeSkippable ? (
                  "Skip for now"
                ) : (
                  <>
                    Continue
                    <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {index > 0 && (
          <button
            type="button"
            onClick={back}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back
          </button>
        )}
      </motion.form>
    </AnimatePresence>
  );
}

function ResumePicker({
  file,
  setFile,
  set,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  set: <K extends StudentField>(key: K, value: StudentApplication[K]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={resumeRules.types.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          set("resume", f ? { name: f.name, size: f.size, type: f.type } : null);
        }}
      />
      {file ? (
        <div className="flex h-12 items-center gap-3 rounded-xl border border-input px-4">
          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[14px]">{file.name}</span>
          <button
            type="button"
            aria-label="Remove resume"
            onClick={() => {
              setFile(null);
              set("resume", null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          id={INPUT_ID}
          type="button"
          autoFocus
          aria-labelledby="question"
          aria-describedby={`${INPUT_ID}-hint`}
          onClick={() => inputRef.current?.click()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-[15px] text-muted-foreground outline-none transition-colors duration-300 hover:border-columbia hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Upload className="size-4" aria-hidden="true" />
          Upload a PDF
        </button>
      )}
    </>
  );
}
