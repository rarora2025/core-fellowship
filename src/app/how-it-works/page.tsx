import type { Metadata } from "next";

import { Navbar } from "@/components/site/navbar";
import { Reveal } from "@/components/how/reveal";
import { howIntro } from "@/content/how-it-works";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How CORE Fellowship connects Columbia students with early-stage startups.",
};

/**
 * A plain reading page: one column, real paragraphs.
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

      </main>
    </>
  );
}
