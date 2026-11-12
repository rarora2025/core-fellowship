import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/hero/hero";
import { accents, type Accent } from "@/components/hero/accents";
import { HowBubble } from "@/components/site/how-bubble";

// While we pick a title accent, preview each one with ?style=marker|underline|circle|note.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  const accent = accents.includes(style as Accent) ? (style as Accent) : "marker";
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero accent={accent} />
      </main>
      <HowBubble />
    </>
  );
}
