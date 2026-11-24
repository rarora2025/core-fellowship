import type { Metadata } from "next";

import { BoardView } from "@/components/board/board-view";
import { loadApplicants, onBoard } from "@/lib/server/board";

export const metadata: Metadata = { title: "Board" };
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  // The layout shows the sign-in; this is a second check.
  if (!(await onBoard())) return null;
  return <BoardView applicants={await loadApplicants()} />;
}
