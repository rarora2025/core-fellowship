import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** CORE's logo (the wordmark with the lightbulb under the O). */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="CORE Fellowship home" className={cn("inline-flex items-center", className)}>
      <Image
        src="/core-logo-tile.png"
        alt="CORE"
        width={447}
        height={447}
        priority
        className="size-9 rounded-lg sm:size-10"
      />
    </Link>
  );
}
