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
  const dark = pathname === "/";
  const { gatedGo } = useGatedNav();

  const itemCls = (active: boolean) =>
    cn(
      "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition",
      dark
        ? active
          ? "text-lime-soft"
          : "text-white/55 hover:text-white"
        : active
          ? "text-primary-active"
          : "text-muted-foreground hover:text-foreground",
    );

  const iconCls = (active: boolean) =>
    cn(
      "flex size-8 items-center justify-center rounded-full transition-colors",
      active && (dark ? "bg-white/10" : "bg-primary-soft"),
    );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t md:hidden",
        dark
          ? "bg-forest/95 border-white/10 backdrop-blur-xl"
          : "border-hairline bg-card",
      )}
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-md items-center">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={itemCls(pathname === "/")}
        >
          <span className={iconCls(pathname === "/")}>
            <Home className="size-5" />
          </span>
          Home
        </Link>
        <Link
          href="/search"
          aria-current={pathname === "/search" ? "page" : undefined}
          className={itemCls(pathname === "/search")}
        >
          <span className={iconCls(pathname === "/search")}>
            <Search className="size-5" />
          </span>
          Search
        </Link>
        <button
          type="button"
          aria-label="Sell a book"
          onClick={() => gatedGo("/sell")}
          className="flex min-h-12 flex-1 flex-col items-center justify-center py-1"
        >
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-full shadow-lg transition active:scale-95",
              dark
                ? "bg-lime-soft text-forest shadow-lime-soft/20"
                : "bg-primary text-primary-foreground shadow-primary/25",
            )}
          >
            <Plus className="size-6" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => gatedGo("/chats")}
          aria-current={pathname.startsWith("/chats") ? "page" : undefined}
          className={itemCls(pathname.startsWith("/chats"))}
        >
          <span className={iconCls(pathname.startsWith("/chats"))}>
            <MessageCircle className="size-5" />
          </span>
          Chats
        </button>
        <Link
          href="/profile"
          aria-current={pathname === "/profile" ? "page" : undefined}
          className={itemCls(pathname === "/profile")}
        >
          <span className={iconCls(pathname === "/profile")}>
            <User className="size-5" />
          </span>
          Profile
        </Link>
      </div>
    </nav>
  );
}
