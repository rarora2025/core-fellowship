import type { Metadata } from "next";

import { BoardSignIn } from "@/components/board/board-sign-in";
import { BoardView } from "@/components/board/board-view";
import { PortalHeader } from "@/components/portal/portal-header";
import { boardConfigured, interviewerNames, loadApplicants, onBoard, developerAccess } from "@/lib/server/board";

export const metadata: Metadata = { title: "Board", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BoardPage() {
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
      <BoardView applicants={await loadApplicants()} interviewers={interviewerNames} canSignOut={!(await developerAccess())} />
    </>
  );
}
