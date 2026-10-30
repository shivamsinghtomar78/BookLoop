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
      <div className="bg-surface-soft/40 flex-1" />
      <div className="border-hairline bg-card h-16 border-t" />
    </div>
  );
}
