// Home (Task 3.1, D-049/D-050): hero promise, then mode tabs re-scope every
// shelf; shelves have linked headings + See all; "Books for your class" is
// profile-aware. Hybrid layout: horizontal shelves < md, grids md+ (D-054).

import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import { BookCard, type BookCardData } from "@/components/book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { InstallPrompt } from "@/components/install-prompt";
import { Departments } from "@/components/marketing/departments";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ShopByClass } from "@/components/marketing/shop-by-class";
import type { HeroPhoto } from "@/components/marketing/hero-photo";
import {
  activeListingsByMode,
  activeListingsForClass,
  recentActiveListings,
  searchListings,
} from "@/db/repos/listings";
import { HERO_BOOK_PHOTOS } from "@/db/seed-photos";
import { getImpactStats } from "@/services/impact";
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

      <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 sm:gap-4 md:hidden">
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

/** Live listing covers first, then curated real book photos to fill the rail. */
function heroPhotos(books: BookCardData[]): HeroPhoto[] {
  const seen = new Set<string>();
  const photos: HeroPhoto[] = [];

  for (const b of books) {
    if (!b.photoUrl || seen.has(b.photoUrl)) continue;
    seen.add(b.photoUrl);
    photos.push({ src: b.photoUrl, alt: b.title });
    if (photos.length >= 10) return photos;
  }

  for (const src of HERO_BOOK_PHOTOS) {
    if (photos.length >= 10) break;
    if (seen.has(src)) continue;
    seen.add(src);
    photos.push({ src, alt: "A school book listed on BookLoop" });
  }
  return photos;
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

  const [classShelf, recent, donations, wanted, stats] = await Promise.all([
    viewerClass && !mode
      ? activeListingsForClass(viewerClass, 12)
      : Promise.resolve([]),
    mode ? searchListings({ mode }, viewerClass, 24) : recentActiveListings(12),
    mode ? Promise.resolve([]) : activeListingsByMode("donate", 12),
    mode ? Promise.resolve([]) : activeListingsByMode("exchange", 12),
    getImpactStats(),
  ]);

  const allIds = [...classShelf, ...recent, ...donations, ...wanted].map((b) => b.id);
  const savedSet = current
    ? await wishlistedIds(current.profile.id, allIds)
    : new Set<number>();

  const photos = heroPhotos([...classShelf, ...recent, ...donations, ...wanted]);

  return (
    <>
      <Hero stats={stats} photos={photos} />

      <Departments />

      <div id="browse" className="scroll-mt-24">
        <div className="mt-10 flex flex-wrap items-end justify-between gap-3 md:mt-14">
          <div>
            <p className="text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
              Browse the loop
            </p>
            <h2 className="font-display text-ink mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Find your next book
            </h2>
          </div>
          <Link
            href="/search"
            className="text-body hover:text-ink group inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            Explore all
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mode tabs — one tap re-scopes the page (D-049) */}
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          {MODE_TABS.map((t) => {
            const active = (mode ?? "") === t.value;
            return (
              <Link
                key={t.value}
                href={t.value ? `/?mode=${t.value}` : "/"}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition",
                  active
                    ? "border-ink bg-ink text-white shadow-sm"
                    : "border-hairline bg-card text-body hover:border-ink/20 hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      <InstallPrompt />

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
            href="/donate"
            books={donations}
            savedSet={savedSet}
          />
          <Shelf
            title="Wanted for exchange"
            href="/exchange"
            books={wanted}
            savedSet={savedSet}
          />
        </>
      )}

      {recent.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Nothing here yet"
          description="Be the first to pass a book on — it takes under a minute to list."
          className="mt-16"
        >
          <Link
            href="/sell"
            className="bg-primary text-primary-foreground hover:bg-primary-active inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition"
          >
            List a book
          </Link>
        </EmptyState>
      )}

      <ShopByClass />
      <HowItWorks />
    </>
  );
}
