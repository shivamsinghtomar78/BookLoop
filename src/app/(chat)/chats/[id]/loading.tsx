// Loading skeleton for the full-screen thread.

export default function ChatLoading() {
  return (
    <div className="flex h-full flex-col" aria-busy="true" aria-label="Loading chat">
      <div className="border-hairline bg-card flex h-14 items-center gap-3 border-b px-3">
        <div className="bg-surface-soft size-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="bg-surface-soft h-3 w-40 rounded" />
          <div className="bg-surface-soft h-2.5 w-24 rounded" />
        </div>
      </div>

      <div className="border-hairline bg-card flex h-12 items-center gap-2 border-b px-4">
        <div className="bg-surface-soft h-2.5 w-full max-w-sm rounded" />
      </div>

      <div className="bg-surface-soft/40 flex flex-1 flex-col gap-3 overflow-hidden px-3 py-4 sm:px-4">
        {[
          { w: "w-40", self: "self-start" },
          { w: "w-56", self: "self-end" },
          { w: "w-32", self: "self-start" },
          { w: "w-48", self: "self-end" },
          { w: "w-44", self: "self-start" },
        ].map((b, i) => (
          <div
            key={i}
            className={`bg-card border-hairline h-9 rounded-2xl border ${b.w} ${b.self}`}
          />
        ))}
      </div>

      <div className="border-hairline bg-card flex items-center gap-2 border-t px-3 py-2.5">
        <div className="bg-surface-soft h-11 flex-1 rounded-2xl" />
        <div className="bg-surface-soft size-11 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
