"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { easeOutSoft } from "@/components/motion/easing";
import { applyLinks } from "@/content/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: easeOutSoft, delay: 0.15 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500",
        scrolled ? "border-border/70 bg-background/80 backdrop-blur-xl" : "border-transparent"
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8"
      >
        <Logo />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href={applyLinks.student.href}>
              Apply
              <ArrowUpRight className="transition-transform duration-300 group-hover/button:-translate-y-px group-hover/button:translate-x-px" />
            </Link>
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}
