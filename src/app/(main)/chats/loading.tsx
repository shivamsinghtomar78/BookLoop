import { Skeleton } from "@/components/ui/skeleton";

export default function ChatsLoading() {
  return (
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-lg">
      <Skeleton className="h-9 w-32 rounded-lg" />
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="mt-1.5 h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
