import { Skeleton } from "@/components/ui/skeleton";

export default function ListingLoading() {
  return (
    <div className="pb-32 lg:pb-8" aria-busy="true" aria-label="Loading listing">
      <Skeleton className="mt-4 h-4 w-56 rounded" />

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
        <div>
          <Skeleton className="aspect-[4/3] w-full rounded-2xl lg:hidden" />
          <div className="hidden lg:grid lg:grid-cols-[76px_minmax(0,1fr)] lg:gap-3">
            <div className="flex flex-col gap-3">
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
            </div>
            <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-2/3 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-12 w-32 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="mt-1.5 h-3 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>

      <div className="mt-12">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="mt-2 h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
