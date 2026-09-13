// Styled 404 — never a dead end (WORKFLOW.md rule 4).

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl">🔎</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        This page doesn&apos;t exist — but plenty of books do.
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        Browse books
      </Link>
    </main>
  );
}
