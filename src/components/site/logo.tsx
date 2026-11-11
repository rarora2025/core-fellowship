import Link from "next/link";
import { cn } from "@/lib/utils";

/** Typographic wordmark. Swap for a final logo file when one exists. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CORE Fellowship home"
      className={cn("inline-flex items-baseline gap-1.5 text-foreground", className)}
    >
      <span className="text-[13px] font-semibold tracking-[0.18em]">CORE</span>
      <span className="font-serif text-[19px] font-normal italic tracking-[-0.01em] [font-variation-settings:'opsz'_24]">
        Fellowship
      </span>
    </Link>
  );
}
