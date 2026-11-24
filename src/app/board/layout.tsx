import type { Metadata } from "next";

import { BoardSignIn } from "@/components/board/board-sign-in";
import { BoardChrome } from "@/components/board/board-tabs";
import { PortalHeader } from "@/components/portal/portal-header";
import { boardConfigured, developerAccess, onBoard } from "@/lib/server/board";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Every board tab shares this: the top bar and the blue header stay put
 * when switching tabs, so only the content below changes.
 */
export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  if (!(await onBoard())) {
    return (
      <>
        <PortalHeader board />
        <BoardSignIn configured={boardConfigured()} />
      </>
    );
  }
  return (
    <>
      <PortalHeader board />
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-10 sm:px-8 sm:pt-12">
        <BoardChrome canSignOut={!(await developerAccess())} />
      </div>
      {children}
    </>
  );
}
