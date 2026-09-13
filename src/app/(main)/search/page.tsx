// Search & discovery (Task 3.2): ILIKE title search + URL-held filter chips,
// class-smart default sort, dead-end-free empty state (WORKFLOW.md §9).

import Link from "next/link";
import { Suspense } from "react";
import { BookCard } from "@/components/book-card";
import { SearchBar } from "@/components/search/search-bar";
import { FilterChips } from "@/components/search/filter-chips";
import { CreateAlertButton } from "@/components/search/create-alert-button";
import {
  countForClass,
  searchListings,
  type SearchFilters,
} from "@/db/repos/listings";
import { getCurrentUser } from "@/services/users";
import { wishlistedIds } from "@/services/wishlist";

export const dynamic = "force-dynamic";

type RawParams = { [key: string]: string | string[] | undefined };

function parseFilters(sp: RawParams): SearchFilters {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const clsNum = s("class") ? Number(s("class")) : undefined;
  return {
    q: s("q"),
    mode: ["sell", "exchange", "donate"].includes(s("mode") ?? "")
      ? (s("mode") as SearchFilters["mode"])
      : undefined,
    category: ["textbook", "reference", "competitive", "novel"].includes(
      s("category") ?? "",
    )
      ? (s("category") as SearchFilters["category"])
      : undefined,
    class: clsNum && Number.isInteger(clsNum) && clsNum >= 1 && clsNum <= 12 ? clsNum : undefined,
    subject: s("subject"),
    exam: s("exam"),
    condition: ["like_new", "good", "fair", "worn"].includes(s("condition") ?? "")
      ? (s("condition") as SearchFilters["condition"])
      : undefined,
    price: ["u100", "100to200", "o200"].includes(s("price") ?? "")
      ? (s("price") as SearchFilters["price"])
      : undefined,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const current = await getCurrentUser();
  const viewerClass = current?.profile.class;

  const results = await searchListings(filters, viewerClass);
  const savedSet = current
    ? await wishlistedIds(
        current.profile.id,
        results.map((r) => r.id),
      )
    : new Set<number>();

  // Relaxed-filter suggestion for the empty state
  let relaxed: { cls: number; count: number } | null = null;
  if (results.length === 0 && viewerClass) {
    const count = await countForClass(viewerClass);
    if (count > 0) relaxed = { cls: viewerClass, count };
  }

  return (
    <div className="mt-4 flex flex-col gap-4 md:mt-6">
      <h1 className="sr-only">Search books</h1>
      <div className="mx-auto w-full max-w-xl">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>
      <Suspense>
        <FilterChips />
      </Suspense>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              layout="grid"
              saved={savedSet.has(b.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-4xl">🔍</p>
          <p className="font-semibold">No match yet</p>
          <p className="text-subtle max-w-xs text-sm">
            Set an alert and we&apos;ll tell you the moment someone lists it.
          </p>
          <Suspense>
            <CreateAlertButton />
          </Suspense>
          {relaxed && (
            <Link
              href={`/search?class=${relaxed.cls}`}
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              {relaxed.count} book{relaxed.count === 1 ? "" : "s"} in Class{" "}
              {relaxed.cls} — see all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
