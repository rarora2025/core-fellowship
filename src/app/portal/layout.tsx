import type { Metadata } from "next";

import { PortalHeader } from "@/components/portal/portal-header";

export const metadata: Metadata = {
  title: "My portal",
  robots: { index: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalHeader />
      {children}
    </>
  );
}
