import type { Metadata } from "next";

import { ApplyHeader } from "@/components/apply/apply-header";
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
      <ApplyHeader />
      <main id="main" className="mx-auto w-full max-w-[600px] px-5 pb-24 pt-8 sm:pt-14">
        <StudentApplicationForm initialEmail={typeof email === "string" ? email.slice(0, 200) : ""} />
      </main>
    </>
  );
}
