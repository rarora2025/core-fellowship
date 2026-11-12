import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/hero/hero";
import { HowBubble } from "@/components/site/how-bubble";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
      </main>
      <HowBubble />
    </>
  );
}
