"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyLinks } from "@/content/site";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The start of the student application, sitting right in the hero.
 * Entering an email hands off to /apply/student with it prefilled.
 * (Startups are handled by CORE directly for now, not through the site.)
 */
export function StartCard() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const id = React.useId();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError("Enter a valid email so we can follow up.");
      return;
    }
    const href = applyLinks.student.href;
    router.push(`${href}?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="w-full rounded-[22px] border border-border bg-card p-2 shadow-[0_1px_2px_rgb(var(--shadow-color)/0.05),0_24px_48px_-24px_rgb(var(--shadow-color)/0.25)]"
    >
      <div className="px-3 pb-3 pt-4 text-left sm:px-4">
        <Label htmlFor={`${id}-email`}>Columbia email</Label>
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
          placeholder="you@columbia.edu"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-2"
        />
        <p id={`${id}-error`} role="alert" className="min-h-5 pt-1.5 text-[13px] text-destructive">
          {error}
        </p>

        <Button type="submit" size="lg" variant="cta" className="mt-1 h-12 w-full rounded-xl">
          Start your application
          <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
        </Button>
      </div>
    </form>
  );
}

/** In place of the start card for someone who has already applied. */
export function WelcomeBack({ first }: { first: string }) {
  return (
    <div className="w-full rounded-[22px] border border-border bg-card p-2 text-left shadow-[0_1px_2px_rgb(var(--shadow-color)/0.05),0_24px_48px_-24px_rgb(var(--shadow-color)/0.25)]">
      <div className="px-3 pb-3 pt-4 sm:px-4">
        <p className="text-[17px] font-medium tracking-[-0.01em]">Welcome back{first ? `, ${first}` : ""}.</p>
        <p className="mt-1 text-[14px] text-muted-foreground">You&apos;ve applied. Your profile and your conversation are in your portal.</p>
        <Button asChild size="lg" variant="cta" className="mt-4 h-12 w-full rounded-xl">
          <Link href="/portal">
            Go to my portal
            <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
