import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/hero/hero";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        {/* Next steps: How it works, For students, For startups, FAQ, footer. */}
      </main>
    </>
  );
}
