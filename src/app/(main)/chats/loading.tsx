import { Skeleton } from "@/components/ui/skeleton";

export default function ChatsLoading() {
  return (
    <div
      className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-lg"
      aria-busy="true"
      aria-label="Loading chats"
    >
      <Skeleton className="h-9 w-32 rounded-lg" />
      <Skeleton className="mt-2 h-3.5 w-64 rounded" />
      <div className="mt-4 flex flex-col gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card flex items-center gap-3 rounded-2xl p-3">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-10 shrink-0 rounded" />
              </div>
              <Skeleton className="mt-1.5 h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
