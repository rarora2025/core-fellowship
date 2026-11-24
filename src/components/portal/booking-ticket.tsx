"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Video } from "lucide-react";

import { CoreBulb } from "@/components/brand/core-bulb";
import { easeOutSoft } from "@/components/motion/easing";
import { interviewCopy } from "@/content/interviews";
import { formatDay, formatRange, placeOf, type Slot } from "@/lib/interviews";
import { cn } from "@/lib/utils";

/** Where it happens, with the right icon; a Meet link opens. */
export function Place({ slot, className }: { slot: Pick<Slot, "location">; className?: string }) {
  const place = placeOf(slot);
  const Icon = place.url ? Video : MapPin;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {place.url ? (
        <a href={place.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
          {place.label}
        </a>
      ) : (
        place.label
      )}
    </span>
  );
}

/**
 * A booked conversation as a card styled like the CORE logo tile:
 * white on logo blue, with the lightbulb from the O. Actions go below
 * the tear line.
 */
export function BookingTicket({
  slot,
  children,
  className,
}: {
  slot: Slot;
  children?: React.ReactNode;
  className?: string;
}) {
  const reduce = !!useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: easeOutSoft }}
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-cta text-white shadow-[0_24px_48px_-24px_rgb(var(--shadow-color)/0.45)]",
        className
      )}
      aria-label="Your conversation"
    >
      <CoreBulb lightUp className="pointer-events-none absolute -right-3 -top-4 h-40 w-auto text-white/15 sm:right-6 sm:h-44" />
      <div className="relative p-6 pb-5 sm:p-7 sm:pb-6">
        <p className="font-display text-[14px] font-bold tracking-[-0.01em] text-white/85">Your conversation</p>
        <p className="mt-5 text-[14px] text-white/80">{formatDay(slot.start)}</p>
        <p className="mt-0.5 font-display text-[clamp(1.6rem,1.3rem+1.4vw,2.1rem)] font-bold leading-tight tracking-[-0.02em]">
          {formatRange(slot)}
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-white/90">
          <Place slot={slot} />
          <span aria-hidden="true" className="text-white/50">
            ·
          </span>
          <span>{interviewCopy.length}</span>
        </p>
      </div>
      {children && (
        <>
          <div aria-hidden="true" className="relative mx-6 border-t border-dashed border-white/35 sm:mx-7" />
          <div className="relative flex flex-wrap items-center gap-2 p-4 sm:px-7">{children}</div>
        </>
      )}
    </motion.section>
  );
}
