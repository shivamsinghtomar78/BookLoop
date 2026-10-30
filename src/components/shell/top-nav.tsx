"use client";

// Desktop nav (≥ md) — full nav bar in the header; bottom tab bar handles < md.
// Same intent gating as BottomNav via useGatedNav.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGatedNav } from "@/components/shell/use-gated-nav";
import { cn } from "@/lib/utils";

export function TopNav({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();
  const { gatedGo, session } = useGatedNav();

  const linkCls = (active: boolean) =>
    cn(
      "rounded-full px-3.5 py-2 text-sm font-medium transition",
      dark
        ? active
          ? "text-lime-soft"
          : "text-white/60 hover:bg-white/5 hover:text-white"
        : active
          ? "text-primary"
          : "text-muted-foreground hover:bg-surface-soft hover:text-ink",
    );

  return (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
      <Link href="/" className={linkCls(pathname === "/")}>
        Home
      </Link>
      <Link href="/search" className={linkCls(pathname === "/search")}>
        Search
      </Link>
      <button
        type="button"
        onClick={() => gatedGo("/chats")}
        className={linkCls(pathname.startsWith("/chats"))}
      >
        Chats
      </button>
      <Link href="/profile" className={linkCls(pathname === "/profile")}>
        Profile
      </Link>
      {session && (
        <Button
          size="default"
          onClick={() => gatedGo("/sell")}
          className={cn(
            "ml-2 rounded-full",
            dark &&
              "bg-lime-soft text-forest hover:bg-[#d6fbe6] focus-visible:ring-lime-soft/40",
          )}
        >
          <Plus className="size-4" /> Sell a book
        </Button>
      )}
    </nav>
  );
}
