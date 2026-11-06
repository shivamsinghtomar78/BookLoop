// Listing detail — responsive: stacked flow below lg, two-column product
// page (gallery left, sticky info right) from lg up (D-054).
// Full version (seller card, sticky chat bar, wishlist heart) = Phase 3 Task 3.3.

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq, ne, sql as dsql } from "drizzle-orm";
import { ChevronRight, Info, Quote, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookCard, type BookCardData } from "@/components/book-card";
import { ListingGallery } from "@/components/listing/listing-gallery";
import { OpenChatButton } from "@/components/chat/open-chat-button";
import { expireStaleReservation } from "@/services/transactions";
import { getDb } from "@/db/client";
import { listingPhotos, listings, ratings, users } from "@/db/schema";
import { getCurrentUser } from "@/services/users";
import { wishlistedIds } from "@/services/wishlist";
import { activeListingsForClass, recentActiveListings } from "@/db/repos/listings";
import { CONDITIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return {};
  const [row] = await getDb()
    .select({
      title: listings.title,
      class: listings.class,
      subject: listings.subject,
      genre: listings.genre,
      mode: listings.mode,
    })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!row) return { title: "Book not found" };
  const meta =
    row.class && row.subject
      ? `Class ${row.class} · ${row.subject}`
      : (row.subject ?? row.genre ?? "");
  const action = row.mode === "donate" ? "Free" : row.mode === "exchange" ? "Up for exchange" : "For sale";
  return {
    title: row.title,
    description: `${action}${meta ? ` — ${meta}` : ""} on BookLoop, the school book exchange.`,
    robots: { index: false, follow: false },
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  // Lazy 72h zombie-reservation check (D-043) — may flip reserved → active
  if (listing.status === "reserved") {
    const relisted = await expireStaleReservation(listing.id);
    if (relisted) listing.status = "active";
  }

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

  const details: [string, string][] = [];
  if (listing.class) details.push(["Class", String(listing.class)]);
  if (listing.subject) details.push(["Subject", listing.subject]);
  if (listing.genre) details.push(["Category", listing.genre]);
  if (conditionLabel) details.push(["Condition", conditionLabel]);
  if (listing.editionYear) details.push(["Edition", String(listing.editionYear)]);
  details.push([
    "Listed",
    listing.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  ]);

  const sellerName = seller?.fullName ?? "A student";
  const sellerListings = sellerStats?.activeListings ?? 0;
  const sellerThumbs = sellerStats?.thumbsUp ?? 0;

  const [classPool, recentPool] = await Promise.all([
    listing.class ? activeListingsForClass(listing.class, 9) : Promise.resolve([]),
    recentActiveListings(12),
  ]);
  const seenIds = new Set([listing.id]);
  const similar: BookCardData[] = [];
  for (const b of [...classPool, ...recentPool]) {
    if (seenIds.has(b.id)) continue;
    seenIds.add(b.id);
    similar.push(b);
    if (similar.length === 6) break;
  }
  const similarSaved =
    current && similar.length > 0
      ? await wishlistedIds(
          current.profile.id,
          similar.map((b) => b.id),
        )
      : new Set<number>();

  return (
    <div className="mx-auto mt-3 max-w-6xl pb-32 lg:mt-6 lg:pb-8">
      <nav
        aria-label="Breadcrumb"
        className="text-subtle mb-4 flex min-w-0 items-center gap-1 text-xs"
      >
        <Link href="/search" className="hover:text-ink shrink-0 transition">
          Search
        </Link>
        {listing.class && (
          <>
            <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />
            <Link
              href={`/search?class=${listing.class}`}
              className="hover:text-ink shrink-0 transition"
            >
              Class {listing.class}
            </Link>
          </>
        )}
        <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />
        <span className="text-body truncate">{listing.title}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
        <ListingGallery
          photos={photos.map((p) => ({ id: p.id, url: p.url }))}
          title={listing.title}
          listingId={listing.id}
          initialSaved={saved}
          showHeart={!isOwnListing}
        />

        {/* Info column — sticky on lg */}
        <div className="mt-5 flex flex-col gap-4 lg:mt-0 lg:sticky lg:top-20">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {listing.mode === "donate" && (
                <Badge className="bg-free rounded-full text-white">FREE</Badge>
              )}
              {listing.mode === "exchange" && (
                <Badge variant="secondary" className="rounded-full">
                  EXCHANGE
                </Badge>
              )}
              {listing.status === "reserved" && (
                <Badge variant="outline" className="rounded-full">
                  {listing.mode === "donate" ? "Claimed" : "Reserved"}
                </Badge>
              )}
              {listing.status === "closed" && (
                <Badge variant="outline" className="rounded-full">
                  Closed
                </Badge>
              )}
            </div>
            <h1 className="text-display text-ink">{listing.title}</h1>
            <p className="text-subtle text-sm">
              {meta}
              {meta && " · "}
              {conditionLabel}
              {listing.editionYear && ` · ${listing.editionYear}`}
            </p>
          </div>

          <div className="border-hairline flex flex-wrap items-end justify-between gap-3 border-y py-4">
            {listing.mode === "sell" && listing.priceInr != null && (
              <div className="flex items-baseline gap-2.5">
                <p className="font-display text-ink text-4xl leading-none font-semibold">
                  ₹{listing.priceInr}
                </p>
                <span className="bg-surface-soft text-body rounded-full px-2.5 py-1 text-[11px] font-medium">
                  Negotiable
                </span>
              </div>
            )}
            {listing.mode === "exchange" && (
              <p className="text-body text-sm">
                <span className="text-subtle">Wants </span>
                <span className="text-ink font-semibold">
                  {listing.wantsBook ?? "a swap"}
                </span>
              </p>
            )}
            {listing.mode === "donate" && (
              <p className="font-display text-free text-3xl font-semibold">Free</p>
            )}
          </div>

          {listing.conditionNote && (
            <div className="bg-surface-soft/70 rounded-2xl p-3.5">
              <p className="text-subtle flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
                <Quote className="size-3" /> Seller&apos;s note
              </p>
              <p className="text-body mt-1.5 text-sm leading-relaxed">
                {listing.conditionNote}
              </p>
            </div>
          )}

          {/* Seller card — never any contact info (D-004) */}
          <div className="bg-card flex items-center gap-3 rounded-2xl p-4">
            <span
              aria-hidden
              className="bg-primary-soft text-primary-active flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            >
              {initials(sellerName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-sm font-semibold">{sellerName}</p>
              <p className="text-subtle text-xs">
                {seller && `Class ${seller.class} · `}
                {sellerListings} listing{sellerListings === 1 ? "" : "s"}
              </p>
            </div>
            <span
              className="bg-surface-soft text-body flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              title={`${sellerThumbs} helpful ratings`}
            >
              <ThumbsUp className="size-3.5" /> {sellerThumbs}
            </span>
          </div>

          <dl className="border-hairline grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-2xl border p-4 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <dt className="text-subtle shrink-0">{label}</dt>
                <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Sticky chat bar: fixed above the tab bar < lg, inline in the info
              column lg+ — the ONE green action on the page (UI_REFERENCE §3). */}
          {!isOwnListing && listing.status === "active" && (
            <div className="border-hairline bg-card/95 fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t p-3 shadow-[0_-12px_30px_-24px_rgba(0,0,0,0.4)] backdrop-blur md:bottom-0 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
              <div className="mx-auto max-w-md lg:max-w-none">
                <OpenChatButton listingId={listing.id} />
                <p className="text-subtle mt-1.5 text-center text-[11px]">
                  Handover happens at the school pickup point
                </p>
              </div>
            </div>
          )}

          {listing.status === "reserved" && (
            <div className="bg-surface-soft text-body flex items-start gap-2.5 rounded-xl p-3.5 text-sm">
              <Info className="text-primary mt-0.5 size-4 shrink-0" />
              <span>
                This book is reserved.{" "}
                <Link
                  href={`/search?class=${listing.class ?? ""}`}
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  See similar books
                </Link>
              </span>
            </div>
          )}

          {isOwnListing && (
            <div className="bg-surface-soft text-body rounded-xl p-3.5 text-sm">
              This is your listing.{" "}
              <Link
                href={`/sell?edit=${listing.id}`}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Edit it
              </Link>
            </div>
          )}

          <p className="text-subtle text-[10px]">Listing {listing.bookloopId}</p>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="border-hairline mt-12 border-t pt-8">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
                Keep browsing
              </p>
              <h2 className="font-display text-ink mt-1 text-2xl font-semibold tracking-tight">
                {listing.class ? `More in Class ${listing.class}` : "More books like this"}
              </h2>
            </div>
            <Link
              href={listing.class ? `/search?class=${listing.class}` : "/search"}
              className="text-body hover:text-ink shrink-0 text-sm font-medium transition"
            >
              See all
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {similar.map((b: BookCardData) => (
              <BookCard
                key={b.id}
                book={b}
                layout="grid"
                saved={similarSaved.has(b.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
