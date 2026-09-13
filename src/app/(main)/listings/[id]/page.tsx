// Listing detail — responsive: stacked flow below lg, two-column product
// page (gallery left, sticky info right) from lg up (D-054).
// Full version (seller card, sticky chat bar, wishlist heart) = Phase 3 Task 3.3.

import Image from "next/image";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/db/client";
import { listingPhotos, listings, users } from "@/db/schema";
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

  const [photos, [seller]] = await Promise.all([
    db
      .select()
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, id))
      .orderBy(listingPhotos.sortOrder),
    db.select().from(users).where(eq(users.id, listing.sellerId)).limit(1),
  ]);

  const conditionLabel = CONDITIONS.find(
    (c) => c.value === listing.condition,
  )?.label;
  const meta =
    listing.class && listing.subject
      ? `Class ${listing.class} · ${listing.subject}`
      : (listing.subject ?? listing.genre ?? "");

  return (
    <div className="mx-auto mt-4 max-w-5xl pb-8 lg:mt-8 lg:grid lg:grid-cols-2 lg:gap-10">
      {/* Gallery: swipe strip < lg, stacked column lg+ */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0">
        {photos.map((p) => (
          <div
            key={p.id}
            className="bg-surface-soft relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl lg:w-full"
          >
            <Image
              src={p.url}
              alt={listing.title}
              fill
              sizes="(max-width: 1024px) 85vw, 480px"
              className="object-cover"
            />
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
          <p className="text-subtle mt-2 text-xs">
            {listing.bookloopId} · listed by {seller?.fullName ?? "a student"}
            {seller && ` (Class ${seller.class})`}
          </p>
        </div>

        <div className="bg-surface-soft rounded-lg p-3 text-center text-sm">
          💬 Chat with the seller arrives in Phase 4 — handovers happen at the
          school pickup point.
        </div>
      </div>
    </div>
  );
}
