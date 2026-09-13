// Home skeleton — shelves of card ghosts, never a blank load (UX law 6).

import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mt-6 flex flex-col gap-8">
      {[0, 1].map((s) => (
        <section key={s}>
          <Skeleton className="h-6 w-44 rounded-lg" />
          <div className="-mx-4 mt-3 flex gap-3 overflow-hidden px-4 md:grid md:grid-cols-4 lg:grid-cols-5">
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
  );
}
