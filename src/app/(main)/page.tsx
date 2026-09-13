// Guest Home (Task 1.1): shelves reading real seed listings.
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
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {books.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [recent, donations] = await Promise.all([
    recentActiveListings(10),
    activeListingsByMode("donate", 10),
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
            <Link href="/sell" className="text-primary underline-offset-4 hover:underline">
              list a book
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
