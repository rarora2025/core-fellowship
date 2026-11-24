import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileBuilder } from "@/components/portal/profile-builder";
import { profileProgress } from "@/lib/profile";
import { currentStudent, readProfile } from "@/lib/server/portal";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; review?: string }>;
}) {
  const me = await currentStudent();
  if (!me) redirect("/portal");
  const [{ step, review }, profile] = await Promise.all([searchParams, readProfile(me.id)]);
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[680px] flex-col items-center justify-start px-4 pb-12 pt-[max(5rem,12svh)] sm:justify-center sm:px-5 sm:pb-16 sm:pt-20"
    >
      <ProfileBuilder initial={profile} startAt={Number(step) || 0} review={review === "1" && profileProgress(profile).complete} />
    </main>
  );
}
