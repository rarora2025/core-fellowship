import { cn } from "@/lib/utils";

const block = "animate-pulse rounded-[20px] bg-muted";

/** What shows under the board's header while a tab loads, so a click always lands somewhere. */
export function BoardSkeleton({ kind }: { kind: "applicants" | "schedule" }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-8 sm:px-8" aria-busy="true" aria-label="Loading">
      {kind === "applicants" ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={cn(block, "h-[92px]")} />
            ))}
          </div>
          <div className={cn(block, "mt-10 h-5 w-24 rounded-full")} />
          <div className="mt-3 flex gap-2.5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cn(block, "h-[66px] w-[260px] shrink-0")} />
            ))}
          </div>
          <div className={cn(block, "mt-10 h-11 rounded-xl")} />
          <div className={cn(block, "mt-6 h-[320px] rounded-[22px]")} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className={cn(block, "size-10 rounded-full")} />
            <div className={cn(block, "h-6 w-40 rounded-full")} />
            <div className={cn(block, "size-10 rounded-full")} />
          </div>
          <div className={cn(block, "mt-5 h-4 w-56 rounded-full")} />
          <div className={cn(block, "mt-5 h-[560px] rounded-[22px]")} />
        </>
      )}
    </div>
  );
}
