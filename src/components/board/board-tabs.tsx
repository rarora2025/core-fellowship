import Link from "next/link";

import { CoreBulb } from "@/components/brand/core-bulb";
import { cn } from "@/lib/utils";

type Tab = "applicants" | "schedule";

/** Applicants | Schedule, on the header's blue. */
export function BoardTabs({ active }: { active: Tab }) {
  const tabs = [
    { key: "applicants", label: "Applicants", href: "/board" },
    { key: "schedule", label: "Schedule", href: "/board/schedule" },
  ] as const;
  return (
    <nav aria-label="Board" className="inline-flex gap-1 rounded-full bg-white/15 p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium transition-colors duration-200",
            active === t.key ? "bg-white text-[#1d4f99] shadow-[0_2px_8px_-2px_rgb(0_0_0/0.2)]" : "text-white/85 hover:bg-white/10 hover:text-white"
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Pills that sit on the header's blue. */
export const onBluePill =
  "inline-flex h-10 items-center gap-1.5 rounded-full border border-white/40 px-4 text-[14px] font-medium text-white transition-colors hover:bg-white/10";

/**
 * The board's header: a band in the CORE logo blue with the lightbulb from
 * the O, like the cards students see. Same on every board tab.
 */
export function BoardHeader({
  title,
  subtitle,
  active,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  active: Tab;
  actions?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-[28px] bg-cta px-6 pb-6 pt-6 text-white shadow-[0_24px_48px_-28px_rgb(var(--shadow-color)/0.55)] sm:px-9 sm:pb-8 sm:pt-8">
      {/* A soft light in the corner, and the bulb */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-white/15 blur-3xl"
      />
      <CoreBulb lightUp className="pointer-events-none absolute -bottom-6 right-4 -z-10 h-48 w-auto text-white/15 sm:right-10 sm:h-56" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-[14px] font-bold tracking-[-0.01em] text-white/90">
            CORE Fellowship <span className="font-sans font-normal text-white/70">· Board</span>
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,1.5rem+2vw,3rem)] font-bold leading-[1.02] tracking-[-0.03em]">{title}</h1>
          {subtitle && <p className="mt-2 max-w-md text-[15px] text-white/85">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-6">
        <BoardTabs active={active} />
      </div>
    </header>
  );
}
