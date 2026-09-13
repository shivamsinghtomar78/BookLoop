"use client";

// Bottom nav (Task 1.1) — Home · Search · Sell ＋ · Chats · Profile.
// Sell and Chats are intent-gated for guests (D-041): tap → auth sheet → resume.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MessageCircle, Plus, Search, User } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { open } = useAuthSheet();

  function gatedGo(path: string) {
    if (session) router.push(path);
    else open({ intent: path });
  }

  const itemCls = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
      active ? "text-primary" : "text-muted-foreground",
    );

  return (
    <nav className="border-hairline bg-card fixed inset-x-0 bottom-0 z-40 border-t">
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
          className="flex flex-1 flex-col items-center py-1.5"
        >
          <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full">
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
