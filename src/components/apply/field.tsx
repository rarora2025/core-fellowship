import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** ids an input should point aria-describedby at. */
export function describedBy(id: string, { hint, error }: { hint?: React.ReactNode; error?: string }) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  as = "label",
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  /** Use "legend-like" text for groups that aren't a single input. */
  as?: "label" | "span";
  className?: string;
  children: React.ReactNode;
}) {
  const labelText = (
    <>
      {label}
      {optional && <span className="ml-1.5 font-normal text-subtle-foreground">Optional</span>}
    </>
  );
  return (
    <div className={cn("flex flex-col", className)}>
      {as === "label" ? (
        <Label htmlFor={id}>{labelText}</Label>
      ) : (
        <span id={`${id}-label`} className="text-[13px] font-medium text-foreground">
          {labelText}
        </span>
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="pt-1.5 text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
