// Styled 404 — never a dead end (WORKFLOW.md rule 4).

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="bg-primary-soft text-primary ring-primary/10 flex size-16 items-center justify-center rounded-2xl ring-1">
        <BookOpen className="size-7" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
          404
        </p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground max-w-sm">
          This page doesn&apos;t exist — but plenty of books do.
        </p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Browse books
        </Link>
        <Link href="/search" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Search
        </Link>
      </div>
    </main>
  );
}
