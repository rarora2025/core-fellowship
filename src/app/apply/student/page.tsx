import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { StudentApplicationForm } from "@/components/apply/student-application";
import { currentStudent } from "@/lib/server/portal";

export const metadata: Metadata = {
  title: "Student application",
  description: "Apply to CORE Fellowship as a Columbia student.",
};

export default async function StudentApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  // Already applied in this browser: their portal, not a fresh application.
  if (await currentStudent()) redirect("/portal");
  const { email } = await searchParams;
  return (
    <div className="relative min-h-[100svh]">
      <main
        id="main"
        className="mx-auto flex min-h-[100svh] w-full max-w-[680px] flex-col items-center justify-start px-4 pb-12 pt-[max(5.5rem,14svh)] sm:justify-center sm:px-5 sm:pb-16 sm:pt-24"
      >
        <StudentApplicationForm initialEmail={typeof email === "string" ? email.slice(0, 200) : ""} />
      </main>
    </div>
  );
}
