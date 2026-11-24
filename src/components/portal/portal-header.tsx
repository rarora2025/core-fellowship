import Link from "next/link";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { siteConfig } from "@/content/site";

export function PortalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav aria-label="Portal" className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-display text-[17px] font-bold tracking-[-0.02em]">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/portal"
            className="rounded-full px-3 py-2 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            My portal
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
