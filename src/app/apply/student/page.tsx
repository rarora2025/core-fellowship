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
    <div className="relative isolate min-h-[100svh] overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="apply-glow h-[440px] w-[min(760px,130vw)] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_14%,transparent),color-mix(in_oklab,var(--columbia)_12%,transparent)_50%,transparent)] blur-[64px]" />
      </div>
      <div className="fixed right-4 top-3 z-50 sm:right-8">
        <ThemeToggle />
      </div>
      <main
        id="main"
        className="mx-auto flex min-h-[100svh] w-full max-w-[680px] flex-col items-center justify-start px-4 pb-12 pt-[max(5.5rem,14svh)] sm:justify-center sm:px-5 sm:pb-16 sm:pt-24"
      >
        <StudentApplicationForm initialEmail={typeof email === "string" ? email.slice(0, 200) : ""} />
      </main>
    </div>
  );
}
