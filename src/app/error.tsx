"use client";

// Global error boundary — students never see a stack trace (Task 0.3).

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured context lands in Vercel Logs (ARCHITECTURE.md §4)
    console.error("[global-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl">📚</p>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        Don&apos;t worry — your books are safe. Try again, and if it keeps
        happening, tell us from your profile.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
