// Placeholder home — replaced by the real guest shell in Phase 1 (Task 1.1)
// and the full shelf layout in Phase 3 (Task 3.1).

import { Badge } from "@/components/ui/badge";
import { Phase0Demo } from "@/components/phase0-demo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <Badge variant="secondary">Prototype — Phase 0</Badge>
      <h1 className="text-3xl font-bold tracking-tight">BookLoop</h1>
      <p className="text-muted-foreground">
        Give your books a second life — buy, sell, exchange and donate school
        books.
      </p>
      <div className="w-full rounded-2xl bg-card p-6 shadow-none">
        <p className="text-sm text-muted-foreground">
          One book, many students. That&apos;s the loop.
        </p>
      </div>
      <Phase0Demo />
    </main>
  );
}
