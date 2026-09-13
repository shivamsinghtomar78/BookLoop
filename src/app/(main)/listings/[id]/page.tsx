// Listing detail — responsive: stacked flow below lg, two-column product
// page (gallery left, sticky info right) from lg up (D-054).
// Full version (seller card, sticky chat bar, wishlist heart) = Phase 3 Task 3.3.

import Image from "next/image";
import { notFound } from "next/navigation";
import { and, eq, ne, sql as dsql } from "drizzle-orm";
import { ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WishlistHeart } from "@/components/wishlist-heart";
import { getDb } from "@/db/client";
import { listingPhotos, listings, ratings, users } from "@/db/schema";
import { getCurrentUser } from "@/services/users";
import { wishlistedIds } from "@/services/wishlist";
import { CONDITIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!listing || listing.status === "deleted") notFound();

  const current = await getCurrentUser();

  const [photos, [seller], [sellerStats], saved] = await Promise.all([
    db
      .select()
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, id))
      .orderBy(listingPhotos.sortOrder),
    db.select().from(users).where(eq(users.id, listing.sellerId)).limit(1),
    db
      .select({
        thumbsUp: dsql<number>`(SELECT count(*)::int FROM ${ratings} WHERE ${ratings.rateeId} = ${listing.sellerId} AND ${ratings.thumbsUp} = true)`,
        activeListings: dsql<number>`count(*)::int`,
      })
      .from(listings)
      .where(
        and(
          eq(listings.sellerId, listing.sellerId),
          ne(listings.status, "deleted"),
        ),
      ),
    current
      ? wishlistedIds(current.profile.id, [id]).then((s) => s.has(id))
      : Promise.resolve(false),
  ]);

  const isOwnListing = current?.profile.id === listing.sellerId;

  const conditionLabel = CONDITIONS.find(
    (c) => c.value === listing.condition,
  )?.label;
  const meta =
    listing.class && listing.subject
      ? `Class ${listing.class} · ${listing.subject}`
      : (listing.subject ?? listing.genre ?? "");

  return (
    <div className="mx-auto mt-4 max-w-5xl pb-8 lg:mt-8 lg:grid lg:grid-cols-2 lg:gap-10">
      {/* Gallery: swipe strip < lg, stacked column lg+; wishlist heart overlays the first photo */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="bg-surface-soft relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl lg:w-full"
          >
            <Image
              src={p.url}
              alt={`${listing.title} — photo ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 85vw, 480px"
              className="object-cover"
              priority={i === 0}
            />
            {i === 0 && !isOwnListing && (
              <WishlistHeart
                listingId={listing.id}
                initialSaved={saved}
                className="absolute top-2 right-2"
              />
            )}
          </div>
        ))}
      </div>

      {/* Info column — sticky on lg */}
      <div className="mt-4 flex flex-col gap-4 lg:mt-0 lg:self-start lg:sticky lg:top-20">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-display">{listing.title}</h1>
            {listing.mode === "donate" && (
              <Badge className="bg-free text-white">FREE</Badge>
            )}
            {listing.mode === "exchange" && (
              <Badge variant="secondary">EXCHANGE</Badge>
            )}
            {listing.status === "reserved" && (
              <Badge variant="secondary">Reserved</Badge>
            )}
          </div>
          <p className="text-subtle text-sm">
            {meta}
            {meta && " · "}
            {conditionLabel}
            {listing.editionYear && ` · ${listing.editionYear}`}
          </p>
          {listing.mode === "sell" && listing.priceInr != null && (
            <p className="text-2xl font-bold">₹{listing.priceInr}</p>
          )}
          {listing.mode === "exchange" && listing.wantsBook && (
            <p className="font-medium">wants: {listing.wantsBook}</p>
          )}
          {listing.conditionNote && (
            <p className="text-subtle mt-1 text-sm">
              &quot;{listing.conditionNote}&quot;
            </p>
          )}
          <p className="text-subtle mt-2 text-xs">{listing.bookloopId}</p>
        </div>

        {/* Seller card — never any contact info (D-004) */}
        <div className="flex items-center justify-between rounded-2xl bg-card p-4">
          <div>
            <p className="text-sm font-semibold">
              {seller?.fullName ?? "A student"}
            </p>
            <p className="text-subtle text-xs">
              {seller && `Class ${seller.class} · `}
              {sellerStats?.activeListings ?? 0} listing
              {(sellerStats?.activeListings ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
          <span className="text-subtle flex items-center gap-1 text-sm">
            <ThumbsUp className="size-4" /> {sellerStats?.thumbsUp ?? 0}
          </span>
        </div>

        {/* Sticky chat bar: fixed above the tab bar < lg, inline in the info
            column lg+ — the ONE green action on the page (UI_REFERENCE §3).
            Activates in Phase 4. */}
        {!isOwnListing && listing.status === "active" && (
          <div className="border-hairline bg-card fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t p-3 shadow-lg md:bottom-0 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="mx-auto max-w-md lg:max-w-none">
              <Button size="lg" className="w-full" disabled>
                💬 Chat with Seller — coming in Phase 4
              </Button>
              <p className="text-subtle mt-1 text-center text-xs">
                Handover happens at the school pickup point
              </p>
            </div>
          </div>
        )}
        {listing.status === "reserved" && (
          <div className="bg-surface-soft rounded-lg p-3 text-center text-sm">
            This book is reserved.{" "}
            <a
              href={`/search?class=${listing.class ?? ""}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              See similar books
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
