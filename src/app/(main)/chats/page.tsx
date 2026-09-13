// Chats placeholder — real chat lands in Phase 4. Auth-gated by proxy.ts.

export default function ChatsPage() {
  return (
    <div className="mt-16 flex flex-col items-center gap-3 text-center">
      <p className="text-4xl">💬</p>
      <h1 className="text-xl font-bold">Chats</h1>
      <p className="text-subtle max-w-xs text-sm">
        Chats with buyers and sellers appear here from Phase 4 — no phone
        numbers, ever.
      </p>
    </div>
  );
}
