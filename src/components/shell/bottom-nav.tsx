"use client";

// Bottom tab bar — mobile only (< md); TopNav takes over from md up.
// Sell and Chats are intent-gated for guests (D-041). Items ≥ 44px tall.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Plus, Search, User } from "lucide-react";
import { useGatedNav } from "@/components/shell/use-gated-nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { gatedGo } = useGatedNav();

  const itemCls = (active: boolean) =>
    cn(
      "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition",
      active ? "text-primary" : "text-muted-foreground",
    );

  return (
    <nav
      className="border-hairline bg-card fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-center">
        <Link href="/" className={itemCls(pathname === "/")}>
          <Home className="size-5" />
          Home
        </Link>
        <Link href="/search" className={itemCls(pathname === "/search")}>
          <Search className="size-5" />
          Search
        </Link>
        <button
          type="button"
          aria-label="Sell a book"
          onClick={() => gatedGo("/sell")}
          className="flex min-h-12 flex-1 flex-col items-center justify-center py-1"
        >
          <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-full">
            <Plus className="size-6" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => gatedGo("/chats")}
          className={itemCls(pathname.startsWith("/chats"))}
        >
          <MessageCircle className="size-5" />
          Chats
        </button>
        <Link href="/profile" className={itemCls(pathname === "/profile")}>
          <User className="size-5" />
          Profile
        </Link>
      </div>
    </nav>
  );
}
