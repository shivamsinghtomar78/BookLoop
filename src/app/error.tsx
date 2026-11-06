"use client";

// Global error boundary — students never see a stack trace (Task 0.3).

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

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
      <span className="bg-free/10 text-free ring-free/15 flex size-16 items-center justify-center rounded-2xl ring-1">
        <TriangleAlert className="size-7" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-sm">
          Don&apos;t worry — your books are safe. Try again, and if it keeps
          happening, tell us from your profile.
        </p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
