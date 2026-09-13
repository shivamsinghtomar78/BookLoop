"use client";

// Desktop nav (≥ md) — full nav bar in the header; bottom tab bar handles < md.
// Same intent gating as BottomNav via useGatedNav.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGatedNav } from "@/components/shell/use-gated-nav";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const { gatedGo } = useGatedNav();

  const linkCls = (active: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition hover:text-foreground",
      active ? "text-primary" : "text-muted-foreground",
    );

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
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
      <Button size="default" className="ml-2" onClick={() => gatedGo("/sell")}>
        <Plus className="size-4" /> Sell a book
      </Button>
    </nav>
  );
}
