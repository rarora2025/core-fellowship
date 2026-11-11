import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark: a small mark (two linked nodes, the idea of a match)
 * followed by the name. Swap for a final logo file when one exists.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CORE Fellowship home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <svg
        viewBox="0 0 28 28"
        className="size-7 text-foreground"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="8" fill="currentColor" />
        <path
          d="M9.5 10c5 0 4 8 9 8"
          fill="none"
          stroke="var(--columbia)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="9" cy="10" r="2.4" fill="#fff" />
        <circle cx="19" cy="18" r="2.4" fill="var(--columbia)" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.02em]">
        CORE <span className="font-normal text-muted-foreground">Fellowship</span>
      </span>
    </Link>
  );
}
