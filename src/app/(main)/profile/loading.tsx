import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div
      className="mx-auto mt-6 flex w-full max-w-md flex-col gap-6 md:max-w-2xl lg:mt-8 lg:grid lg:max-w-5xl lg:grid-cols-[minmax(280px,1fr)_2fr] lg:items-start lg:gap-8"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="mt-2 h-4 w-56 rounded" />
              <Skeleton className="mt-1.5 h-3 w-32 rounded" />
            </div>
            <Skeleton className="size-9 rounded-full" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="mt-2 h-16 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
