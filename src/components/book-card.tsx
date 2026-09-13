// Book card — flat, photo-led, max 5 elements (UI_REFERENCE.md §3/§6.3, D-049).
// No border, no shadow: rounded photo + whitespace carry the card.

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CONDITIONS } from "@/lib/constants";

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

export function BookCard({ book }: { book: BookCardData }) {
  const meta =
    book.class && book.subject
      ? `Class ${book.class} · ${book.subject}`
      : (book.subject ?? book.genre ?? "");

  return (
    <Link
      href={`/listings/${book.id}`}
      className="group block w-40 shrink-0 sm:w-44"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-soft">
        {book.photoUrl && (
          <Image
            src={book.photoUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 160px, 176px"
            className="object-cover transition duration-300 ease-out group-hover:scale-110"
          />
        )}
        {book.mode === "donate" && (
          <Badge className="bg-free absolute top-2 left-2 text-white">FREE</Badge>
        )}
        {book.mode === "exchange" && (
          <Badge variant="secondary" className="absolute top-2 left-2">
            EXCHANGE
          </Badge>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        <p className="truncate text-sm font-semibold">{book.title}</p>
        <p className="text-subtle truncate text-xs">
          {meta}
          {meta && " · "}
          {conditionLabel(book.condition)}
        </p>
        {book.mode === "sell" && book.priceInr != null && (
          <p className="text-sm font-semibold">₹{book.priceInr}</p>
        )}
        {book.mode === "exchange" && book.wantsBook && (
          <p className="text-subtle truncate text-xs">wants: {book.wantsBook}</p>
        )}
      </div>
    </Link>
  );
}
