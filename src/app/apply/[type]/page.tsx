import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

// Temporary stand-in so the hero CTAs don't 404. The real multi-step
// application flows replace this in a later step.
const flows = {
  student: "Student application",
  startup: "Startup application",
} as const;

export function generateStaticParams() {
  return Object.keys(flows).map((type) => ({ type }));
}

export default async function ApplyPlaceholder({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!(type in flows)) notFound();
  const title = flows[type as keyof typeof flows];

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <h1 className="mt-10 text-headline font-medium">{title}</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        This form is the next thing we&apos;re building. Check back soon.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">
          <ArrowLeft />
          Back home
        </Link>
      </Button>
    </main>
  );
}
