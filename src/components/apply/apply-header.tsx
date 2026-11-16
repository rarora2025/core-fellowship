import Link from "next/link";

import { ThemeToggle } from "@/components/site/theme-toggle";

export function ApplyHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-5 sm:px-8">
      <Link
        href="/"
        className="rounded-md font-display text-[17px] font-bold tracking-[-0.02em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="text-brand-logo">CORE</span> Fellowship
      </Link>
      <ThemeToggle />
    </header>
  );
}
