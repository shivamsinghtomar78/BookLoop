import { Skeleton } from "@/components/ui/skeleton";

export default function ListingLoading() {
  return (
    <div className="mx-auto mt-4 max-w-5xl lg:mt-8 lg:grid lg:grid-cols-2 lg:gap-10">
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <div className="mt-4 flex flex-col gap-3 lg:mt-0">
        <Skeleton className="h-8 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
