// Exchange tab (Task 5.1/5.2): "For you" shelf (offers wanting books YOU
// have listed) + all offers as one-line HAS ⇄ WANTS cards + post-offer CTA.

import Image from "next/image";
import Link from "next/link";
import { inArray } from "drizzle-orm";
import { ArrowLeftRight, ArrowRight, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDb } from "@/db/client";
import { listingPhotos, listings } from "@/db/schema";
import { getCurrentUser } from "@/services/users";
import {
  activeExchangeOffers,
  forYouExchangeOffers,
} from "@/services/exchange";

export const dynamic = "force-dynamic";

type Offer = typeof listings.$inferSelect;

const STEPS = [
  "Offer a book you're done with.",
  "We show it to students who have the one you want.",
  "Chat, agree, and meet at school.",
];

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
      className="group border-hairline bg-card hover:border-primary/25 flex items-center gap-3 rounded-2xl border p-3 transition-colors"
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
      <ChevronRight className="text-hairline group-hover:text-primary size-4 shrink-0 transition-colors" />
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
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-3xl lg:max-w-5xl">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-display">Exchange</h1>
        <Link href="/sell?mode=exchange" className={buttonVariants({ size: "default" })}>
          Post an offer
        </Link>
      </div>
      <p className="text-subtle mt-1 text-sm">
        Swap a book you&apos;re done with for one you need.
      </p>

      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div>
          {forYou.length > 0 && (
            <section>
              <div className="flex items-center gap-2">
                <h2 className="text-title-lg">For you</h2>
                <span className="bg-primary-soft text-primary-active rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                  Matched
                </span>
              </div>
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

          <section className={forYou.length > 0 ? "mt-8" : undefined}>
            <h2 className="text-title-lg">All offers</h2>
            {rest.length === 0 && forYou.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title="No exchange offers yet"
                description="Have a book you're done with? Offer it for the one you need next."
                className="mt-8"
              >
                <Link href="/sell?mode=exchange" className={buttonVariants({ size: "lg" })}>
                  Post the first offer
                </Link>
              </EmptyState>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {rest.map((o) => (
                  <OfferRow key={o.id} offer={o} photo={coverMap.get(o.id) ?? null} />
                ))}
              </div>
            )}
          </section>

          {(rest.length > 0 || forYou.length > 0) && (
            <Link
              href="/search"
              className="group bg-surface-soft/60 ring-hairline hover:ring-primary/25 mt-5 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1 transition"
            >
              <span className="text-sm">
                <span className="text-ink font-medium">Looking for a specific title?</span>{" "}
                <span className="text-subtle">Browse every book in your school.</span>
              </span>
              <ArrowRight className="text-subtle group-hover:text-primary size-4 shrink-0 transition-colors" />
            </Link>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="bg-surface-soft/60 ring-hairline sticky top-24 rounded-2xl p-5 ring-1">
            <p className="text-ink text-sm font-semibold">How a swap works</p>
            <ol className="mt-4 flex flex-col gap-3.5">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="text-primary ring-hairline bg-card mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1">
                    {i + 1}
                  </span>
                  <span className="text-body text-xs leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/sell?mode=exchange"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "mt-5 w-full",
              })}
            >
              Post an offer
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
