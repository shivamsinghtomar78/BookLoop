// Sell placeholder — the real photo-first form lands in Phase 2 (Task 2.2).
// Route is auth-gated by proxy.ts; guests reach it only via the auth sheet.

export default function SellPage() {
  return (
    <div className="mt-16 flex flex-col items-center gap-3 text-center">
      <p className="text-4xl">📷</p>
      <h1 className="text-xl font-bold">Sell a book</h1>
      <p className="text-subtle max-w-xs text-sm">
        The 2-minute photo-first listing form arrives in Phase 2. You&apos;re
        signed in and ready for it.
      </p>
    </div>
  );
}
