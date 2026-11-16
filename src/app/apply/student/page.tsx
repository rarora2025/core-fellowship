import type { Metadata } from "next";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { StudentApplicationForm } from "@/components/apply/student-application";

export const metadata: Metadata = {
  title: "Student application",
  description: "Apply to CORE Fellowship as a Columbia student.",
};

export default async function StudentApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <>
      <div className="fixed right-5 top-3 z-50 sm:right-8">
        <ThemeToggle />
      </div>
      <main
        id="main"
        className="mx-auto flex min-h-[100svh] w-full max-w-[680px] flex-col items-center justify-center px-5 pb-16 pt-24"
      >
        <StudentApplicationForm initialEmail={typeof email === "string" ? email.slice(0, 200) : ""} />
      </main>
    </>
  );
}
