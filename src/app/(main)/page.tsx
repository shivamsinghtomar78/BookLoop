// Guest Home: hybrid shelf/grid (D-054) — horizontal-scroll shelves below md
// (thumb-friendly), responsive grids from md up (desktop-native reflow).
// Mode tabs + class-aware shelf land in Phase 3 Task 3.1 (D-050).

import Link from "next/link";
import { BookCard, type BookCardData } from "@/components/book-card";
import {
  activeListingsByMode,
  recentActiveListings,
} from "@/db/repos/listings";

export const dynamic = "force-dynamic";

function Shelf({ title, books }: { title: string; books: BookCardData[] }) {
  if (books.length === 0) return null;
  return (
    <section className="mt-6 md:mt-10">
      <h2 className="text-title-lg">{title}</h2>

      {/* < md: horizontal shelf */}
      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 md:hidden">
        {books.map((b) => (
          <BookCard key={b.id} book={b} layout="shelf" />
        ))}
      </div>

      {/* md+: responsive grid — more books as the screen grows */}
      <div className="mt-4 hidden grid-cols-3 gap-4 md:grid lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {books.map((b) => (
          <BookCard key={b.id} book={b} layout="grid" />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [recent, donations] = await Promise.all([
    recentActiveListings(12),
    activeListingsByMode("donate", 12),
  ]);

  return (
    <div>
      <Shelf title="Recently listed" books={recent} />
      <Shelf title="Free — donations available" books={donations} />
      {recent.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <p className="text-4xl">📚</p>
          <p className="font-semibold">No books yet</p>
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
