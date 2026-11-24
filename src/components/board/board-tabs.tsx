"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Download } from "lucide-react";

import { CoreBulb } from "@/components/brand/core-bulb";
import { easeOutSoft } from "@/components/motion/easing";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "applicants", label: "Applicants", href: "/board", subtitle: "Everyone who's applied. Search, sort, and pool them." },
  { key: "schedule", label: "Schedule", href: "/board/schedule", subtitle: "CORE's interview times. You're both on every conversation." },
] as const;

/** Pills that sit on the header's blue. */
export const onBluePill =
  "inline-flex h-10 items-center gap-1.5 rounded-full border border-white/40 px-4 text-[14px] font-medium text-white transition-colors hover:bg-white/10";

/**
 * The board's header, shared by every board tab so it never redraws when
 * switching: a band in the CORE logo blue with the lightbulb from the O.
 * The tab pill slides to the tab you pick; the title follows.
 */
export function BoardChrome({ canSignOut }: { canSignOut: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const here = pathname.startsWith("/board/schedule") ? TABS[1] : TABS[0];
  // Switch the pill and title the instant a tab is pressed; the page catches up.
  const [pressed, setPressed] = React.useState<string | null>(null);
  React.useEffect(() => setPressed(null), [pathname]);
  const active = TABS.find((t) => t.key === pressed) ?? here;

  async function signOut() {
    await fetch("/api/board/session", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  return (
    <header className="relative isolate overflow-hidden rounded-[28px] bg-cta px-6 pb-6 pt-6 text-white shadow-[0_24px_48px_-28px_rgb(var(--shadow-color)/0.55)] sm:px-9 sm:pb-8 sm:pt-8">
      <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-white/15 blur-3xl" />
      <CoreBulb lightUp className="pointer-events-none absolute -bottom-6 right-4 -z-10 h-48 w-auto text-white/15 sm:right-10 sm:h-56" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-[14px] font-bold tracking-[-0.01em] text-white/90">
            CORE Fellowship <span className="font-sans font-normal text-white/70">· Board</span>
          </p>
          <motion.div
            key={active.key}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOutSoft }}
          >
            <h1 className="mt-3 font-display text-[clamp(2rem,1.5rem+2vw,3rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              {active.label}
            </h1>
            <p className="mt-2 max-w-md text-[15px] text-white/85">{active.subtitle}</p>
          </motion.div>
        </div>
        <div className="flex flex-wrap gap-2">
          {active.key === "applicants" && (
            <a href="/api/board/export" className={onBluePill}>
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </a>
          )}
          {canSignOut && (
            <button type="button" onClick={signOut} className={cn(onBluePill, "text-white/85")}>
              Sign out
            </button>
          )}
        </div>
      </div>

      <nav aria-label="Board" className="relative mt-6 inline-flex gap-1 rounded-full bg-white/15 p-1">
        {TABS.map((t) => {
          const on = t.key === active.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={on ? "page" : undefined}
              onClick={() => setPressed(t.key)}
              className={cn(
                "relative inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium transition-colors duration-200",
                on ? "text-[#1d4f99]" : "text-white/85 hover:text-white"
              )}
            >
              {on && (
                <motion.span
                  layoutId="board-tab"
                  transition={{ duration: reduce ? 0 : 0.35, ease: easeOutSoft }}
                  className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_2px_8px_-2px_rgb(0_0_0/0.2)]"
                />
              )}
              <span className="relative">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
