import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Navbar } from "@/components/site/navbar";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/how/reveal";
import { applyLinks } from "@/content/site";
import { howClosing, howIntro, howSteps } from "@/content/how-it-works";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How CORE Fellowship matches Columbia students with early-stage startups: you apply, we talk, and we make the introduction.",
};

/**
 * A plain reading page: one column, real paragraphs, a numbered list.
 * Motion is limited to a slow fade as each block arrives.
 */
export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto max-w-[680px] px-5 pb-32 pt-36 sm:px-8 sm:pt-44">
        <Reveal as="h1" delay={0.1} className="text-[clamp(2.2rem,1.6rem+2vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.035em]">
          How it works
        </Reveal>

        <div className="mt-8 space-y-6 text-[18px] leading-[1.7] text-muted-foreground">
          {howIntro.map((p, i) => (
            <Reveal key={i} as="p" delay={0.35 + i * 0.2}>
              {p}
            </Reveal>
          ))}
        </div>

        <ol className="mt-16 border-t border-border">
          {howSteps.map((s, i) => (
            <Reveal
              key={s.title}
              as="li"
              delay={i < 1 ? 0.8 : 0}
              className="grid grid-cols-[2.5rem_1fr] gap-x-2 border-b border-border py-8 sm:grid-cols-[3.5rem_1fr]"
            >
              <span className="pt-0.5 text-[15px] tabular-nums text-subtle-foreground">{i + 1}</span>
              <div>
                <h2 className="text-[20px] font-medium tracking-[-0.015em] text-foreground">{s.title}</h2>
                <p className="mt-2 text-[17px] leading-[1.7] text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-16">
          <h2 className="text-[20px] font-medium tracking-[-0.015em]">{howClosing.title}</h2>
          <p className="mt-2 text-[17px] leading-[1.7] text-muted-foreground">{howClosing.body}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={applyLinks.student.href}>
                I&apos;m a student
                <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={applyLinks.startup.href}>I&apos;m a startup</Link>
            </Button>
          </div>
        </Reveal>
      </main>
    </>
  );
}
