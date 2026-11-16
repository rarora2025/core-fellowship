"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup } from "@/components/apply/chip-group";
import { Field, describedBy } from "@/components/apply/field";
import { StepProgress } from "@/components/apply/step-progress";
import { easeOutSoft } from "@/components/motion/easing";
import {
  gradYears,
  interestOptions,
  lookingForMax,
  resumeRules,
  roleOptions,
  skillSuggestions,
  studentSteps,
} from "@/content/student-application";
import {
  emptyStudentApplication,
  normalizeLinkedIn,
  stepFields,
  validateFields,
  validateStudentApplication,
  type StudentApplication,
  type StudentErrors,
  type StudentField,
} from "@/lib/applications/student";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "core:student-application";
const fieldId = (f: StudentField) => `student-${f}`;

function loadDraft(): Partial<StudentApplication> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(a: StudentApplication) {
  try {
    // The resume file can't be stored, so leave it out of the draft.
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...a, resume: null }));
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function StudentApplicationForm({ initialEmail = "" }: { initialEmail?: string }) {
  const reduce = !!useReducedMotion();
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState<StudentApplication>({ ...emptyStudentApplication, email: initialEmail });
  const [file, setFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<StudentErrors>({});
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [hydrated, setHydrated] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const firstRender = React.useRef(true);

  // Restore a saved draft once, keeping a freshly entered email from the homepage.
  React.useEffect(() => {
    const draft = loadDraft();
    if (draft) setData((d) => ({ ...d, ...draft, email: initialEmail || draft.email || d.email, resume: null }));
    setHydrated(true);
  }, [initialEmail]);

  React.useEffect(() => {
    if (hydrated && status !== "sent") saveDraft(data);
  }, [data, hydrated, status]);

  // Move focus to the new step's heading so screen readers follow along.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step, status, reduce]);

  function set<K extends StudentField>(key: K, value: StudentApplication[K]) {
    setData((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function focusFirstError(errs: StudentErrors) {
    const first = (Object.keys(errs) as StudentField[])[0];
    if (first) requestAnimationFrame(() => document.getElementById(fieldId(first))?.focus());
  }

  const current = studentSteps[step];
  const isReview = current.key === "review";

  function next() {
    const errs = validateFields(stepFields[current.key], data);
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    if (current.key === "experience" && data.linkedin) set("linkedin", normalizeLinkedIn(data.linkedin));
    setStep((s) => Math.min(s + 1, studentSteps.length - 1));
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const errs = validateStudentApplication(data);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const badStep = studentSteps.findIndex((s) => stepFields[s.key].some((f) => errs[f]));
      if (badStep >= 0) setStep(badStep);
      return;
    }
    setStatus("sending");
    try {
      const body = new FormData();
      body.set("data", JSON.stringify({ ...data, resume: null }));
      if (file) body.set("resume", file);
      const res = await fetch("/api/applications/student", { method: "POST", body });
      if (!res.ok) throw new Error(String(res.status));
      clearDraft();
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  const stepMotion = {
    initial: { opacity: 0, y: reduce ? 0 : 14 },
    animate: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.8, ease: easeOutSoft } },
    exit: { opacity: 0, y: reduce ? 0 : -8, transition: { duration: reduce ? 0.1 : 0.3, ease: easeOutSoft } },
  };

  if (status === "sent") {
    const first = data.name.trim().split(/\s+/)[0];
    return (
      <motion.div {...stepMotion} className="pt-6 text-center">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-[1.9rem] font-bold tracking-[-0.025em] outline-none">
          Thanks{first ? `, ${first}` : ""}.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Your application is in. We&apos;ll reach out at{" "}
          <span className="text-foreground">{data.email}</span> once we&apos;ve read it.
        </p>
        <Button asChild variant="outline" className="mt-10">
          <Link href="/">
            <ArrowLeft />
            Back home
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <StepProgress steps={studentSteps} current={step} />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (isReview) submit();
          else next();
        }}
        className="mt-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current.key} {...stepMotion}>
            <p className="text-[13px] text-subtle-foreground" aria-live="polite">
              Step {step + 1} of {studentSteps.length}
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 font-display text-[1.9rem] font-bold tracking-[-0.025em] outline-none"
            >
              {current.title}
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">{current.intro}</p>

            <div className="mt-9 flex flex-col gap-7">
              {current.key === "about" && <AboutStep data={data} errors={errors} set={set} />}
              {current.key === "experience" && (
                <ExperienceStep data={data} errors={errors} set={set} file={file} setFile={setFile} />
              )}
              {current.key === "goals" && <GoalsStep data={data} errors={errors} set={set} />}
              {current.key === "review" && <ReviewStep data={data} goTo={setStep} />}
            </div>
          </motion.div>
        </AnimatePresence>

        {status === "failed" && (
          <p role="alert" className="mt-6 text-[13px] text-destructive">
            Something went wrong sending your application. Your answers are saved here, so try again in a moment.
          </p>
        )}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={back}>
              <ArrowLeft />
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" size="lg" className="rounded-xl" disabled={status === "sending"}>
            {isReview ? (
              status === "sending" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending
                </>
              ) : (
                "Submit application"
              )
            ) : (
              <>
                Continue
                <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
              </>
            )}
          </Button>
        </div>
        {hydrated && !isReview && (
          <p className="mt-4 text-right text-[12px] text-subtle-foreground">Your answers save on this device as you go.</p>
        )}
      </form>
    </div>
  );
}

type StepProps = {
  data: StudentApplication;
  errors: StudentErrors;
  set: <K extends StudentField>(key: K, value: StudentApplication[K]) => void;
};

function AboutStep({ data, errors, set }: StepProps) {
  return (
    <>
      <Field id={fieldId("name")} label="Full name" error={errors.name}>
        <Input
          id={fieldId("name")}
          autoComplete="name"
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={describedBy(fieldId("name"), { error: errors.name })}
        />
      </Field>
      <Field id={fieldId("email")} label="Columbia email" error={errors.email}>
        <Input
          id={fieldId("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@columbia.edu"
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={describedBy(fieldId("email"), { error: errors.email })}
        />
      </Field>
      <div className="grid gap-7 sm:grid-cols-2 sm:gap-4">
        <Field id={fieldId("gradYear")} label="Graduation year" error={errors.gradYear}>
          <select
            id={fieldId("gradYear")}
            value={data.gradYear}
            onChange={(e) => set("gradYear", e.target.value)}
            aria-invalid={!!errors.gradYear}
            aria-describedby={describedBy(fieldId("gradYear"), { error: errors.gradYear })}
            className={cn(
              "h-12 w-full appearance-none rounded-xl border border-input bg-background bg-[length:16px] bg-[right_1rem_center] bg-no-repeat px-4 text-[15px] outline-none transition-[border-color,box-shadow] duration-300",
              "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a919c%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
              "focus-visible:border-columbia-deep/60 focus-visible:ring-4 focus-visible:ring-columbia-soft",
              "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
              !data.gradYear && "text-subtle-foreground"
            )}
          >
            <option value="" disabled>
              Select
            </option>
            {gradYears.map((y) => (
              <option key={y} value={y} className="text-foreground">
                {y}
              </option>
            ))}
          </select>
        </Field>
        <Field id={fieldId("major")} label="Major" error={errors.major}>
          <Input
            id={fieldId("major")}
            placeholder="Computer Science"
            value={data.major}
            onChange={(e) => set("major", e.target.value)}
            aria-invalid={!!errors.major}
            aria-describedby={describedBy(fieldId("major"), { error: errors.major })}
          />
        </Field>
      </div>
    </>
  );
}

function ExperienceStep({
  data,
  errors,
  set,
  file,
  setFile,
}: StepProps & { file: File | null; setFile: (f: File | null) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const skillsHint = "Pick a few, or add your own and press Enter.";

  return (
    <>
      <Field id={fieldId("linkedin")} label="LinkedIn" error={errors.linkedin}>
        <Input
          id={fieldId("linkedin")}
          type="url"
          inputMode="url"
          placeholder="linkedin.com/in/yourname"
          value={data.linkedin}
          onChange={(e) => set("linkedin", e.target.value)}
          aria-invalid={!!errors.linkedin}
          aria-describedby={describedBy(fieldId("linkedin"), { error: errors.linkedin })}
        />
      </Field>

      <Field id={fieldId("resume")} label="Resume" optional hint={resumeRules.label} error={errors.resume} as="span">
        <input
          ref={inputRef}
          id={fieldId("resume")}
          type="file"
          accept={resumeRules.types.join(",")}
          className="sr-only"
          aria-labelledby={`${fieldId("resume")}-label`}
          aria-describedby={describedBy(fieldId("resume"), { hint: resumeRules.label, error: errors.resume })}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            set("resume", f ? { name: f.name, size: f.size, type: f.type } : null);
          }}
        />
        {data.resume && file ? (
          <div className="flex h-12 items-center gap-3 rounded-xl border border-input px-4">
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[14px]">{data.resume.name}</span>
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
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-[14px] text-muted-foreground outline-none transition-colors duration-300 hover:border-columbia hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Upload className="size-4" aria-hidden="true" />
            Upload a PDF
          </button>
        )}
      </Field>

      <Field id={fieldId("skills")} label="Skills" hint={skillsHint} error={errors.skills} as="span">
        <ChipGroup
          id={fieldId("skills")}
          options={skillSuggestions}
          value={data.skills}
          onChange={(v) => set("skills", v)}
          allowCustom
          customPlaceholder="Add a skill"
          invalid={!!errors.skills}
          describedBy={describedBy(fieldId("skills"), { hint: skillsHint, error: errors.skills })}
        />
      </Field>
    </>
  );
}

function GoalsStep({ data, errors, set }: StepProps) {
  const remaining = lookingForMax - data.lookingFor.length;
  return (
    <>
      <Field id={fieldId("interests")} label="Areas you're into" error={errors.interests} as="span">
        <ChipGroup
          id={fieldId("interests")}
          options={interestOptions}
          value={data.interests}
          onChange={(v) => set("interests", v)}
          invalid={!!errors.interests}
          describedBy={describedBy(fieldId("interests"), { error: errors.interests })}
        />
      </Field>
      <Field id={fieldId("roles")} label="Roles you'd want" error={errors.roles} as="span">
        <ChipGroup
          id={fieldId("roles")}
          options={roleOptions}
          value={data.roles}
          onChange={(v) => set("roles", v)}
          invalid={!!errors.roles}
          describedBy={describedBy(fieldId("roles"), { error: errors.roles })}
        />
      </Field>
      <Field
        id={fieldId("lookingFor")}
        label="What are you looking for?"
        hint="A summer internship, part time work during the semester, something you want to learn. Whatever's true."
        error={errors.lookingFor}
      >
        <Textarea
          id={fieldId("lookingFor")}
          value={data.lookingFor}
          maxLength={lookingForMax + 200}
          onChange={(e) => set("lookingFor", e.target.value)}
          aria-invalid={!!errors.lookingFor}
          aria-describedby={describedBy(fieldId("lookingFor"), { hint: true, error: errors.lookingFor })}
        />
        <p className={cn("pt-1.5 text-right text-[12px]", remaining < 0 ? "text-destructive" : "text-subtle-foreground")}>
          {remaining}
        </p>
      </Field>
    </>
  );
}

function ReviewStep({ data, goTo }: { data: StudentApplication; goTo: (step: number) => void }) {
  const sections: { step: number; title: string; rows: [string, React.ReactNode][] }[] = [
    {
      step: 0,
      title: "About you",
      rows: [
        ["Name", data.name],
        ["Email", data.email],
        ["Graduation", data.gradYear],
        ["Major", data.major],
      ],
    },
    {
      step: 1,
      title: "Your experience",
      rows: [
        ["LinkedIn", data.linkedin.replace(/^https?:\/\/(www\.)?/, "")],
        ["Resume", data.resume?.name ?? <span key="none" className="text-subtle-foreground">None</span>],
        ["Skills", data.skills.join(", ")],
      ],
    },
    {
      step: 2,
      title: "What you want",
      rows: [
        ["Areas", data.interests.join(", ")],
        ["Roles", data.roles.join(", ")],
        ["Looking for", <span key="lf" className="whitespace-pre-line">{data.lookingFor}</span>],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {sections.map((s) => (
        <section key={s.title} className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-medium">{s.title}</h2>
            <button
              type="button"
              onClick={() => goTo(s.step)}
              className="text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Edit<span className="sr-only"> {s.title}</span>
            </button>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2.5 text-[14px] sm:grid-cols-[110px_1fr]">
            {s.rows.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="min-w-0 break-words">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
