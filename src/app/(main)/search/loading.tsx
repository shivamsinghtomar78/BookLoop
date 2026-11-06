import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="mt-4 flex flex-col gap-4" aria-busy="true" aria-label="Loading search">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-3.5 w-64 rounded" />
      </div>
      <Skeleton className="h-11 w-full rounded-full md:h-10" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-11 flex-1 rounded-full sm:w-64 sm:flex-none" />
        <Skeleton className="h-11 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="mt-2 h-4 w-3/4 rounded" />
            <Skeleton className="mt-1 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
