"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";

/** Copies the student's private portal link. */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-full text-[13.5px] font-medium text-columbia-deep underline-offset-4 hover:underline"
    >
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Link2 className="size-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy my private link"}
    </button>
  );
}
