"use client";

// Guest auth actions in the site header. Authed actions live in TopNav /
// BottomNav, so this renders nothing once a session exists.

import { Button } from "@/components/ui/button";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function HeaderAuth({ dark = false }: { dark?: boolean }) {
  const { data: session, isPending } = useSession();
  const { open } = useAuthSheet();

  if (isPending) {
    return (
      <div
        aria-hidden
        className={cn(
          // Match the settled cluster so nothing nudges at hydration.
          "h-9 w-[8.25rem] animate-pulse rounded-full",
          dark ? "bg-white/10" : "bg-surface-soft",
        )}
      />
    );
  }
  if (session) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => open({ mode: "login" })}
        className={cn(
          "hidden rounded-full px-3.5 text-sm sm:inline-flex",
          dark
            ? "text-white/75 hover:bg-white/10 hover:text-white"
            : "text-body hover:bg-surface-soft hover:text-ink",
        )}
      >
        Log in
      </Button>
      <Button
        size="sm"
        onClick={() => open({ mode: "signup" })}
        className={cn(
          "rounded-full px-4 text-sm",
          dark
            ? "bg-lime-soft text-forest shadow-[0_10px_30px_-14px_rgba(186,245,212,0.9)] hover:bg-[#d6fbe6]"
            : "bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_rgba(14,159,110,0.9)] hover:bg-primary-active",
        )}
      >
        Sign up
      </Button>
    </div>
  );
}
