"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { easeOutSoft } from "@/components/motion/easing";
import { applyLinks } from "@/content/site";
import { cn } from "@/lib/utils";

type Audience = "student" | "startup";

const copy: Record<Audience, { label: string; emailLabel: string; placeholder: string }> = {
  student: { label: "I’m a student", emailLabel: "Columbia email", placeholder: "you@columbia.edu" },
  startup: { label: "I’m a startup", emailLabel: "Work email", placeholder: "you@company.com" },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The start of both application flows, sitting right in the hero.
 * Picking a side and entering an email hands off to /apply/[type]
 * with the email prefilled.
 */
export function StartCard() {
  const router = useRouter();
  const [audience, setAudience] = React.useState<Audience>("student");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const id = React.useId();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a valid email so we can follow up.");
      return;
    }
    const href = applyLinks[audience].href;
    router.push(`${href}?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="w-full rounded-[22px] border border-border bg-white p-2 shadow-[0_1px_2px_rgba(11,13,18,0.04),0_24px_48px_-24px_rgba(15,44,74,0.18)]"
    >
      {/* Audience switch */}
      <div role="radiogroup" aria-label="I am applying as" className="relative grid grid-cols-2 rounded-2xl bg-muted p-1">
        {(Object.keys(copy) as Audience[]).map((key) => {
          const selected = audience === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setAudience(key);
                setError(null);
              }}
              className={cn(
                "relative z-10 h-10 rounded-xl text-sm transition-colors duration-300",
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${id}-pill`}
                  transition={{ duration: 0.5, ease: easeOutSoft }}
                  className="absolute inset-0 -z-10 rounded-xl bg-white shadow-[0_1px_2px_rgba(11,13,18,0.08)]"
                />
              )}
              {copy[key].label}
            </button>
          );
        })}
      </div>

      <div className="px-3 pb-3 pt-5 text-left sm:px-4">
        <Label htmlFor={`${id}-email`}>{copy[audience].emailLabel}</Label>
        <Input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder={copy[audience].placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-2"
        />
        <p id={`${id}-error`} role="alert" className="min-h-5 pt-1.5 text-[13px] text-destructive">
          {error}
        </p>

        <Button type="submit" size="lg" className="mt-1 w-full rounded-xl">
          Start your application
          <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
        </Button>
      </div>
    </form>
  );
}
