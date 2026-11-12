import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-input bg-background px-4 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-subtle-foreground",
        "focus-visible:border-columbia-deep/60 focus-visible:ring-4 focus-visible:ring-columbia-soft",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
        className
      )}
      {...props}
    />
  );
}

export { Input };
