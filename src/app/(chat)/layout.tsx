import type { ReactNode } from "react";

// Chat surfaces are full-screen: no site header, footer or bottom nav. The
// thread owns its top bar so phones behave like a messaging app.
export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background flex h-[100dvh] flex-col overflow-hidden">
      {children}
    </div>
  );
}
