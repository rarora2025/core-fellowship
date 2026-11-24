/** Shared portal styles, matching the application card. */
export const portalCard =
  "rounded-[22px] border border-border bg-card shadow-[0_1px_2px_rgb(var(--shadow-color)/0.05),0_24px_48px_-24px_rgb(var(--shadow-color)/0.25)]";

export const portalTitle =
  "text-balance font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.7rem)] font-bold leading-[1.1] tracking-[-0.03em]";

/** Buttons that sit on the ticket's blue. */
export const ticketButton = {
  primary:
    "inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13.5px] font-medium text-[#1d4f99] transition-colors hover:bg-white/90",
  outline:
    "inline-flex h-9 items-center rounded-full border border-white/45 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-white/10",
  quiet:
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] text-white/85 transition-colors hover:bg-white/10 hover:text-white",
};
