import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-6 md:max-w-2xl">
      <div className="rounded-2xl bg-card p-5">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-56 rounded" />
        <Skeleton className="mt-1 h-3 w-32 rounded" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-5 w-28 rounded" />
          <Skeleton className="mt-2 h-16 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
