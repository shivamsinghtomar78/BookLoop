// Responsive app shell: fluid max-w-7xl container, TopNav from md up,
// bottom tab bar below md (D-054). Guests see everything read-only (D-041).

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthSheetProvider } from "@/components/auth/auth-sheet";
import { BottomNav } from "@/components/shell/bottom-nav";
import { NotificationBell } from "@/components/shell/notification-bell";
import { TopNav } from "@/components/shell/top-nav";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthSheetProvider>
      <header className="bg-background sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="text-primary text-xl font-bold tracking-tight"
            >
              BookLoop
            </Link>
            <p className="text-subtle hidden text-xs sm:block">
              Give your books a second life
            </p>
          </div>
          <div className="flex items-center gap-1">
            <TopNav />
            <NotificationBell />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 sm:px-6 md:pb-10 lg:px-8">
        {children}
      </main>
      <BottomNav />
    </AuthSheetProvider>
  );
}
