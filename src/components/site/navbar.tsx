"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { easeOutSoft } from "@/components/motion/easing";
import { applyLinks, navLinks } from "@/content/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: easeOutSoft, delay: 0.15 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          "transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open
            ? "border-b border-border/70 bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent"
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
        >
          <Logo />

          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href={applyLinks.startup.href}>For startups</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={applyLinks.student.href}>
                Apply
                <ArrowUpRight className="transition-transform duration-300 group-hover/button:-translate-y-px group-hover/button:translate-x-px" />
              </Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: easeOutSoft }}
            className="fixed inset-x-0 top-16 bottom-0 bg-background md:hidden"
          >
            <ul className="flex flex-col px-5 pt-6">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeOutSoft, delay: 0.05 + i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border py-4 text-2xl tracking-[-0.02em]"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 px-5">
              <Button asChild size="lg">
                <Link href={applyLinks.student.href} onClick={() => setOpen(false)}>
                  {applyLinks.student.label}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={applyLinks.startup.href} onClick={() => setOpen(false)}>
                  {applyLinks.startup.label}
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
