"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { portalCard, portalTitle } from "@/components/portal/ui";
import { cn } from "@/lib/utils";

export function BoardSignIn({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/board/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("That's not the password.");
    router.refresh();
  }

  return (
    <main id="main" className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[460px] flex-col items-center justify-center px-5 text-center">
      <h1 className={portalTitle}>Board</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        {configured ? "For the people running interviews." : "The board isn't switched on yet. Set BOARD_PASSWORD first."}
      </p>
      {configured && (
        <form onSubmit={submit} className={cn(portalCard, "mt-8 w-full p-4 text-left")}>
          <Input
            type="password"
            autoFocus
            aria-label="Board password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p role="alert" className="min-h-5 px-1 pt-1.5 text-[13px] text-destructive">
            {error}
          </p>
          <Button type="submit" variant="cta" size="lg" className="mt-1 h-12 w-full rounded-xl" disabled={busy || !password}>
            {busy ? <Loader2 className="animate-spin" /> : "Open the board"}
          </Button>
        </form>
      )}
    </main>
  );
}
