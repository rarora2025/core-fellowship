import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-32 w-full min-w-0 resize-y rounded-xl border border-input bg-background px-4 py-3 text-base sm:text-[15px] leading-relaxed text-foreground outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-subtle-foreground",
        "focus-visible:border-columbia-deep/60 focus-visible:ring-4 focus-visible:ring-columbia-soft",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
