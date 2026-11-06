// Responsive app shell: fluid max-w-7xl container, TopNav from md up,
// bottom tab bar below md (D-054). Guests see everything read-only (D-041).

import type { ReactNode } from "react";
import { AuthSheetProvider } from "@/components/auth/auth-sheet";
import { BottomNav } from "@/components/shell/bottom-nav";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthSheetProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 outline-none sm:px-6 md:pb-10 lg:px-8"
      >
        {/* Reserve the first screen so a streaming page can't drag the footer
            (and everything under it) into view — the biggest CLS we measured. */}
        <div className="min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-4.5rem)]">{children}</div>
      </main>
      <SiteFooter />
      <BottomNav />
    </AuthSheetProvider>
  );
}
