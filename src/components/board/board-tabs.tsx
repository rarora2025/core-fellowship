import Link from "next/link";

import { cn } from "@/lib/utils";

/** Applicants | Schedule, under the board's title. */
export function BoardTabs({ active }: { active: "applicants" | "schedule" }) {
  const tabs = [
    { key: "applicants", label: "Applicants", href: "/board" },
    { key: "schedule", label: "Schedule", href: "/board/schedule" },
  ] as const;
  return (
    <nav aria-label="Board" className="flex gap-1 rounded-xl bg-muted p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "inline-flex h-9 items-center rounded-lg px-4 text-[14px] transition-colors",
            active === t.key
              ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgb(var(--shadow-color)/0.12)] dark:bg-secondary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
