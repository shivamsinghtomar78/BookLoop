"use client";

// Brand header. Home gets the forest-green treatment so it merges with the
// hero; other surfaces keep the warm-white app chrome.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { HeaderAuth } from "@/components/auth/header-auth";
import { NotificationBell } from "@/components/shell/notification-bell";
import { TopNav } from "@/components/shell/top-nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const dark = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
        dark
          ? cn(
              "bg-forest border-b",
              scrolled
                ? "border-white/10 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
                : "border-transparent",
            )
          : "border-border/70 bg-background/85 border-b backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className={cn(
              "relative flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6",
              dark
                ? "bg-white/10 ring-1 ring-white/15"
                : "bg-primary-soft ring-primary/15 ring-1",
            )}
          >
            <BookOpen
              className={cn(
                "size-[18px]",
                dark ? "text-lime-soft" : "text-primary",
              )}
              strokeWidth={2}
            />
          </span>
          <span className="flex flex-col leading-none">
            <span
              className={cn(
                "font-display text-[1.35rem] font-semibold tracking-tight",
                dark ? "text-white" : "text-ink",
              )}
            >
              Book
              <span className={dark ? "text-lime-soft" : "text-primary"}>
                Loop
              </span>
            </span>
            <span
              className={cn(
                "mt-1 hidden text-[9px] font-semibold tracking-[0.2em] uppercase lg:block",
                dark ? "text-white/60" : "text-subtle",
              )}
            >
              School book exchange
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <TopNav dark={dark} />
          <NotificationBell dark={dark} />
          <HeaderAuth dark={dark} />
        </div>
      </div>
    </header>
  );
}
