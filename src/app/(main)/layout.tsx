// App shell (Task 1.1): header + content + bottom nav, auth sheet provider around it.
// Guests see everything read-only — no login wall (D-041).

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthSheetProvider } from "@/components/auth/auth-sheet";
import { BottomNav } from "@/components/shell/bottom-nav";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthSheetProvider>
      <header className="bg-background sticky top-0 z-30">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="text-primary text-xl font-bold tracking-tight">
            BookLoop
          </Link>
          <p className="text-subtle text-xs">Give your books a second life</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24">{children}</main>
      <BottomNav />
    </AuthSheetProvider>
  );
}
