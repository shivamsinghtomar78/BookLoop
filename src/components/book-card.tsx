// Book card — marketplace-style cover, quiet chrome. Portrait 4:5 photos,
// glass badges, and a price/negotiation footer that reads at a glance.

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { WishlistHeart } from "@/components/wishlist-heart";
import { CONDITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type BookCardData = {
  id: number;
  bookloopId: string;
  title: string;
  mode: "sell" | "exchange" | "donate";
  condition: "like_new" | "good" | "fair" | "worn";
  class: number | null;
  subject: string | null;
  genre: string | null;
  priceInr: number | null;
  wantsBook: string | null;
  photoUrl: string | null;
};

function conditionLabel(value: BookCardData["condition"]) {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

export function BookCard({
  book,
  layout = "shelf",
  saved,
}: {
  book: BookCardData;
  /** "shelf" = fixed width inside horizontal scrollers (< md);
      "grid"  = fluid, fills its grid cell (md+ sections, results pages). */
  layout?: "shelf" | "grid";
  /** When provided, renders the wishlist heart overlay (Task 3.4). */
  saved?: boolean;
}) {
  const meta =
    book.class && book.subject
      ? `Class ${book.class} · ${book.subject}`
      : (book.subject ?? book.genre ?? "");

  return (
    <div
      className={cn(
        "group relative h-full",
        layout === "shelf" ? "w-40 shrink-0 sm:w-44" : "w-full",
      )}
    >
      <Link
        href={`/listings/${book.id}`}
        className="bg-card ring-hairline/80 flex h-full flex-col rounded-2xl ring-1 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(16,40,32,0.45)] hover:ring-hairline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="bg-surface-soft relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl">
          {book.photoUrl && (
            <Image
              src={book.photoUrl}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 176px, (max-width: 1280px) 20vw, 220px"
              className="object-cover transition duration-500 ease-out group-hover:scale-105"
            />
          )}

          {book.mode === "donate" && (
            <Badge className="bg-free absolute top-2.5 left-2.5 rounded-full border-0 px-2.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
              FREE
            </Badge>
          )}
          {book.mode === "exchange" && (
            <Badge className="bg-ink/85 absolute top-2.5 left-2.5 rounded-full border-0 px-2.5 text-[9px] font-bold tracking-wide text-white backdrop-blur">
              EXCHANGE
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-ink line-clamp-2 text-[13px] leading-snug font-semibold sm:text-sm">
            {book.title}
          </h3>
          <p className="text-subtle mt-1 line-clamp-1 text-[11px]">{meta}</p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="min-w-0">
              {book.mode === "sell" && book.priceInr != null && (
                <p className="text-ink flex items-baseline gap-1.5 text-base leading-none font-bold">
                  ₹{book.priceInr}
                  <span className="text-primary text-[10px] font-medium">
                    negotiable
                  </span>
                </p>
              )}
              {book.mode === "exchange" && (
                <p className="text-body line-clamp-1 text-[11px] leading-tight">
                  <span className="text-subtle">Wants </span>
                  <span className="font-medium">{book.wantsBook ?? "a swap"}</span>
                </p>
              )}
              {book.mode === "donate" && (
                <p className="text-free text-sm leading-none font-bold">Free</p>
              )}
            </div>
            <span className="bg-surface-soft text-body shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium">
              {conditionLabel(book.condition)}
            </span>
          </div>
        </div>
      </Link>

      {saved !== undefined && (
        <WishlistHeart
          listingId={book.id}
          initialSaved={saved}
          className="absolute top-1.5 right-1.5 z-10 rounded-full bg-white/85 shadow-sm backdrop-blur"
        />
      )}
    </div>
  );
}
