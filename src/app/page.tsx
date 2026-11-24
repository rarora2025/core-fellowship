import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/hero/hero";
import { accents, type Accent } from "@/components/hero/accents";
import { HowBubble } from "@/components/site/how-bubble";
import { onBoard } from "@/lib/server/board";
import { currentStudent } from "@/lib/server/portal";

// While we pick a title accent, preview each one with ?style=marker|underline|circle|note.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  const accent = accents.includes(style as Accent) ? (style as Accent) : "marker";
  const me = await currentStudent();
  const first = me?.name.trim().split(/\s+/)[0] ?? "";
  return (
    <>
      <Navbar board={await onBoard()} />
      <main id="main">
        <Hero accent={accent} returning={me ? { first: first ? first[0].toUpperCase() + first.slice(1) : "" } : null} />
      </main>
      <HowBubble />
    </>
  );
}
