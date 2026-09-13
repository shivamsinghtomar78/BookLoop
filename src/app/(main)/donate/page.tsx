// Donate tab (Tasks 5.4/5.5): available donations grid + donate CTA.
// Claimed = reserved (shown as "Claimed"); claimed books leave this list
// automatically via the active-status filter.

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BookCard } from "@/components/book-card";
import { activeListingsByMode } from "@/db/repos/listings";
import { getCurrentUser } from "@/services/users";
import { wishlistedIds } from "@/services/wishlist";

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  const current = await getCurrentUser();
  const donations = await activeListingsByMode("donate", 60);
  const savedSet = current
    ? await wishlistedIds(
        current.profile.id,
        donations.map((d) => d.id),
      )
    : new Set<number>();

  return (
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-4xl">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-display">Free books</h1>
        <Link href="/sell?mode=donate" className={buttonVariants({ size: "default" })}>
          Donate a book
        </Link>
      </div>
      <p className="text-subtle mt-1 text-sm">
        Donated by students, free for whoever needs them. Chat to claim — first
        come, first served. 🌱
      </p>

      {donations.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-4xl">🎁</p>
          <p className="font-semibold">No donations right now</p>
          <p className="text-subtle max-w-xs text-sm">
            Give a finished book a second life — it takes two minutes.
          </p>
          <Link href="/sell?mode=donate" className={buttonVariants({ size: "lg" })}>
            Donate the first book
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {donations.map((b) => (
            <BookCard key={b.id} book={b} layout="grid" saved={savedSet.has(b.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
