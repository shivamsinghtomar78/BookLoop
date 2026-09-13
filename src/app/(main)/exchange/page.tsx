// Exchange tab (Task 5.1/5.2): "For you" shelf (offers wanting books YOU
// have listed) + all offers as one-line HAS ⇄ WANTS cards + post-offer CTA.

import Image from "next/image";
import Link from "next/link";
import { inArray } from "drizzle-orm";
import { ArrowLeftRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { listingPhotos, listings } from "@/db/schema";
import { getCurrentUser } from "@/services/users";
import {
  activeExchangeOffers,
  forYouExchangeOffers,
} from "@/services/exchange";

export const dynamic = "force-dynamic";

type Offer = typeof listings.$inferSelect;

async function covers(rows: Offer[]) {
  if (rows.length === 0) return new Map<number, string>();
  const photos = await getDb()
    .select()
    .from(listingPhotos)
    .where(
      inArray(
        listingPhotos.listingId,
        rows.map((r) => r.id),
      ),
    );
  const map = new Map<number, string>();
  for (const p of photos.sort((a, b) => a.sortOrder - b.sortOrder))
    if (!map.has(p.listingId)) map.set(p.listingId, p.url);
  return map;
}

function OfferRow({ offer, photo }: { offer: Offer; photo: string | null }) {
  return (
    <Link
      href={`/listings/${offer.id}`}
      className="flex items-center gap-3 rounded-2xl bg-card p-3"
    >
      <span className="bg-surface-soft relative size-12 shrink-0 overflow-hidden rounded-lg">
        {photo && (
          <Image src={photo} alt={offer.title} fill sizes="48px" className="object-cover" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="text-subtle shrink-0 text-[10px] font-semibold uppercase">Has</span>
          <span className="truncate font-medium">{offer.title}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <ArrowLeftRight className="text-primary size-3.5 shrink-0" />
          <span className="text-subtle shrink-0 text-[10px] font-semibold uppercase">Wants</span>
          <span className="truncate">{offer.wantsBook}</span>
        </span>
      </span>
    </Link>
  );
}

export default async function ExchangePage() {
  const current = await getCurrentUser();

  const [offers, forYou] = await Promise.all([
    activeExchangeOffers(current?.profile.id),
    current ? forYouExchangeOffers(current.profile.id) : Promise.resolve([]),
  ]);
  const forYouIds = new Set(forYou.map((o) => o.id));
  const rest = offers.filter((o) => !forYouIds.has(o.id));
  const coverMap = await covers([...forYou, ...rest]);

  return (
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-display">Exchange</h1>
        <Link href="/sell?mode=exchange" className={buttonVariants({ size: "default" })}>
          Post an offer
        </Link>
      </div>
      <p className="text-subtle mt-1 text-sm">
        Swap a book you&apos;re done with for one you need.
      </p>

      {forYou.length > 0 && (
        <section className="mt-6">
          <h2 className="text-title-lg">✨ For you</h2>
          <p className="text-subtle mt-0.5 text-xs">
            These students want books you have listed.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {forYou.map((o) => (
              <OfferRow key={o.id} offer={o} photo={coverMap.get(o.id) ?? null} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-title-lg">All offers</h2>
        {rest.length === 0 && forYou.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="text-4xl">🔄</p>
            <p className="font-semibold">No exchange offers yet</p>
            <p className="text-subtle max-w-xs text-sm">
              Have a book you&apos;re done with? Offer it for the one you need next.
            </p>
            <Link href="/sell?mode=exchange" className={buttonVariants({ size: "lg" })}>
              Post the first offer
            </Link>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2 xl:grid xl:grid-cols-2">
            {rest.map((o) => (
              <OfferRow key={o.id} offer={o} photo={coverMap.get(o.id) ?? null} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
