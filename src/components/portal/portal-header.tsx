import Link from "next/link";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { onBoard } from "@/lib/server/board";

const navLink = "whitespace-nowrap rounded-full px-2.5 py-2 sm:px-3 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/**
 * Top bar for the portal and the board. On the board it offers a way back
 * to the student side; anywhere else, people signed into the board get a
 * Board link.
 */
export async function PortalHeader({ board = false }: { board?: boolean }) {
  const boardLink = !board && (await onBoard());
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav aria-label="Portal" className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="whitespace-nowrap font-display text-[16px] font-bold tracking-[-0.02em] sm:text-[17px]">
          <span className="text-brand-logo">CORE</span> Fellowship
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {board ? (
            <Link href="/" className={navLink}>
              Student view
            </Link>
          ) : (
            <>
              <Link href="/portal" className={navLink}>
                My portal
              </Link>
              {boardLink && (
                <Link href="/board" className={navLink}>
                  Board
                </Link>
              )}
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
