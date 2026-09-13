// Home (Task 3.1, D-049/D-050): mode tabs re-scope every shelf; shelves have
// linked headings + See all; "Books for your class" is profile-aware.
// Hybrid layout: horizontal shelves < md, responsive grids md+ (D-054).

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BookCard, type BookCardData } from "@/components/book-card";
import {
  activeListingsByMode,
  activeListingsForClass,
  recentActiveListings,
  searchListings,
} from "@/db/repos/listings";
import { getCurrentUser } from "@/services/users";
import { wishlistedIds } from "@/services/wishlist";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MODE_TABS = [
  { value: "", label: "All" },
  { value: "sell", label: "Buy" },
  { value: "exchange", label: "Exchange" },
  { value: "donate", label: "Free" },
] as const;

function Shelf({
  title,
  href,
  books,
  savedSet,
}: {
  title: string;
  href: string;
  books: BookCardData[];
  savedSet: Set<number>;
}) {
  if (books.length === 0) return null;
  return (
    <section className="mt-6 md:mt-10">
      <div className="flex items-baseline justify-between gap-2">
        {/* Shelf headings are links, not labels (UI_REFERENCE.md §7) */}
        <Link href={href} className="group flex items-center gap-1">
          <h2 className="text-title-lg group-hover:underline underline-offset-4">
            {title}
          </h2>
          <ChevronRight className="text-subtle size-4" />
        </Link>
        <Link
          href={href}
          className="text-subtle shrink-0 text-sm hover:text-foreground"
        >
          See all
        </Link>
      </div>

      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 md:hidden">
        {books.map((b) => (
          <BookCard key={b.id} book={b} layout="shelf" saved={savedSet.has(b.id)} />
        ))}
      </div>
      <div className="mt-4 hidden grid-cols-3 gap-4 md:grid lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {books.map((b) => (
          <BookCard key={b.id} book={b} layout="grid" saved={savedSet.has(b.id)} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: rawMode } = await searchParams;
  const mode = ["sell", "exchange", "donate"].includes(rawMode ?? "")
    ? (rawMode as "sell" | "exchange" | "donate")
    : undefined;

  const current = await getCurrentUser();
  const viewerClass = current?.profile.class;

  const [classShelf, recent, donations, wanted] = await Promise.all([
    viewerClass && !mode
      ? activeListingsForClass(viewerClass, 12)
      : Promise.resolve([]),
    mode ? searchListings({ mode }, viewerClass, 24) : recentActiveListings(12),
    mode ? Promise.resolve([]) : activeListingsByMode("donate", 12),
    mode ? Promise.resolve([]) : activeListingsByMode("exchange", 12),
  ]);

  const allIds = [...classShelf, ...recent, ...donations, ...wanted].map((b) => b.id);
  const savedSet = current
    ? await wishlistedIds(current.profile.id, allIds)
    : new Set<number>();

  return (
    <div>
      <h1 className="sr-only">BookLoop — buy, sell, exchange and donate school books</h1>

      {/* Mode tabs — one tap re-scopes the page (D-049) */}
      <div className="border-hairline -mx-4 mt-1 flex overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
        {MODE_TABS.map((t) => {
          const active = (mode ?? "") === t.value;
          return (
            <Link
              key={t.value}
              href={t.value ? `/?mode=${t.value}` : "/"}
              className={cn(
                "-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm font-medium transition",
                active
                  ? "border-b-primary text-foreground"
                  : "border-b-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {mode ? (
        <Shelf
          title={
            mode === "sell"
              ? "Books for sale"
              : mode === "exchange"
                ? "Wanted for exchange"
                : "Free — donations available"
          }
          href={`/search?mode=${mode}`}
          books={recent}
          savedSet={savedSet}
        />
      ) : (
        <>
          {viewerClass && classShelf.length > 0 && (
            <Shelf
              title={`Books for Class ${viewerClass}`}
              href={`/search?class=${viewerClass}`}
              books={classShelf}
              savedSet={savedSet}
            />
          )}
          <Shelf
            title="Recently listed"
            href="/search"
            books={recent}
            savedSet={savedSet}
          />
          <Shelf
            title="Free — donations available"
            href="/search?mode=donate"
            books={donations}
            savedSet={savedSet}
          />
          <Shelf
            title="Wanted for exchange"
            href="/search?mode=exchange"
            books={wanted}
            savedSet={savedSet}
          />
        </>
      )}

      {recent.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <p className="text-4xl">📚</p>
          <p className="font-semibold">Nothing here yet</p>
          <p className="text-subtle text-sm">
            Be the first —{" "}
            <Link
              href="/sell"
              className="text-primary underline-offset-4 hover:underline"
            >
              list a book
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
