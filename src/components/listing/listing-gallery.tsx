"use client";

// Product gallery: a swipe strip on phones, a main image with a thumbnail
// rail from lg up. The wishlist heart sits on the cover in both.

import { useState } from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { WishlistHeart } from "@/components/wishlist-heart";
import { cn } from "@/lib/utils";

type Photo = { id: number; url: string };

export function ListingGallery({
  photos,
  title,
  listingId,
  initialSaved,
  showHeart,
}: {
  photos: Photo[];
  title: string;
  listingId: number;
  initialSaved: boolean;
  showHeart: boolean;
}) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="bg-surface-soft text-subtle flex aspect-[4/3] w-full items-center justify-center rounded-2xl">
        <BookOpen className="size-10" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <>
      {/* Phones: full-bleed snap strip with a peek of the next photo. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 lg:hidden">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="bg-surface-soft relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl"
          >
            <Image
              src={p.url}
              alt={`${title} — photo ${i + 1}`}
              fill
              sizes="86vw"
              className="object-cover"
              priority={i === 0}
            />
            {i === 0 && showHeart && (
              <WishlistHeart
                listingId={listingId}
                initialSaved={initialSaved}
                className="absolute top-2 right-2 rounded-full bg-white/85 shadow-sm backdrop-blur"
              />
            )}
          </div>
        ))}
      </div>

      {/* Desktop: thumbnail rail + one large product shot. */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-[76px_minmax(0,1fr)]">
        {photos.length > 1 && (
          <div className="flex flex-col gap-2">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1} of ${photos.length}`}
                aria-pressed={i === active}
                className={cn(
                  "bg-surface-soft relative aspect-[4/5] w-[76px] overflow-hidden rounded-xl ring-1 transition",
                  i === active
                    ? "ring-primary ring-2"
                    : "ring-hairline opacity-70 hover:opacity-100",
                )}
              >
                <Image src={p.url} alt="" fill sizes="76px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div
          className={cn(
            "bg-surface-soft relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-black/5",
            photos.length === 1 && "lg:col-span-2",
          )}
        >
          <Image
            src={photos[active]?.url ?? photos[0].url}
            alt={`${title} — photo ${active + 1}`}
            fill
            sizes="(max-width: 1280px) 46vw, 560px"
            className="object-cover"
            priority
          />
          {showHeart && (
            <WishlistHeart
              listingId={listingId}
              initialSaved={initialSaved}
              className="absolute top-3 right-3 rounded-full bg-white/85 shadow-sm backdrop-blur"
            />
          )}
          {photos.length > 1 && (
            <span className="text-body absolute right-3 bottom-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
              {active + 1} / {photos.length}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
