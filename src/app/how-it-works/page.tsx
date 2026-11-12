import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Navbar } from "@/components/site/navbar";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/how/reveal";
import { Steps } from "@/components/how/steps";
import { IntroTitle } from "@/components/how/intro-title";
import { applyLinks } from "@/content/site";
import { howClosing, howIntro } from "@/content/how-it-works";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How CORE Fellowship matches Columbia students with early-stage startups: tell us about yourself, we get to know you, then we make the introduction.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Intro */}
        <section aria-labelledby="how-title" className="pb-28 pt-36 sm:pb-40 sm:pt-48">
          <Reveal as="p" y={8} className="text-sm text-brand-deep">
            {howIntro.kicker}
          </Reveal>
          <IntroTitle id="how-title" text={howIntro.title} />
          <div className="mt-14 grid gap-8 md:grid-cols-12">
            {howIntro.paragraphs.map((p, i) => (
              <Reveal
                key={i}
                as="p"
                delay={1.1 + i * 0.25}
                className={
                  "text-[19px] leading-[1.65] md:col-span-5 " +
                  (i === 1 ? "text-foreground md:col-start-7" : "text-muted-foreground")
                }
              >
                {p}
              </Reveal>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section aria-label="The three steps" className="border-t border-border pt-24 sm:pt-32">
          <Steps />
        </section>

        {/* Closing */}
        <section className="py-32 text-center sm:py-48">
          <Reveal as="h2" className="mx-auto max-w-[18ch] text-[clamp(2.2rem,1.4rem+3vw,4rem)] font-medium leading-[1.05] tracking-[-0.035em]">
            {howClosing.title}
          </Reveal>
          <Reveal as="p" delay={0.2} className="mx-auto mt-6 max-w-[46ch] text-[18px] leading-relaxed text-muted-foreground">
            {howClosing.body}
          </Reveal>
          <Reveal delay={0.4} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={applyLinks.student.href}>
                I&apos;m a student
                <ArrowRight className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={applyLinks.startup.href}>I&apos;m a startup</Link>
            </Button>
          </Reveal>
        </section>
      </main>
    </>
  );
}
