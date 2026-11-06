// Home skeleton — hero promise + shelves of card ghosts, never a blank load.

import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-label="Loading home">
      <div className="bleed bg-forest relative overflow-hidden rounded-b-[2rem] px-4 py-12 sm:px-6 md:rounded-b-[2.75rem] lg:px-8 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-6 w-56 rounded-full bg-white/10" />
            <Skeleton className="h-14 w-full max-w-md rounded-2xl bg-white/10" />
            <Skeleton className="h-14 w-4/5 max-w-sm rounded-2xl bg-white/10" />
            <div className="mt-2 flex flex-col gap-2">
              <Skeleton className="h-3.5 w-full max-w-sm bg-white/5" />
              <Skeleton className="h-3.5 w-3/4 max-w-xs bg-white/5" />
            </div>
            <div className="mt-3 flex gap-3">
              <Skeleton className="h-12 w-36 rounded-full bg-white/10" />
              <Skeleton className="h-12 w-32 rounded-full bg-white/5" />
            </div>
          </div>
          <Skeleton className="aspect-[4/3] w-full max-w-[600px] rounded-[2rem] bg-white/5" />
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-8 md:mt-14">
        <div>
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="mt-2 h-8 w-64 rounded-lg" />
          <div className="mt-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {[0, 1].map((s) => (
          <section key={s}>
            <Skeleton className="h-6 w-44 rounded-lg" />
            <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-hidden px-4 md:grid md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-40 shrink-0 sm:w-44 md:w-full">
                  <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                  <Skeleton className="mt-2 h-4 w-3/4 rounded" />
                  <Skeleton className="mt-1 h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
