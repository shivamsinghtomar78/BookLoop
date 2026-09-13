"use client";

// Layered wishlist heart (UI_REFERENCE.md §6.4): white outline over fill —
// readable on any photo. Optimistic toggle; guests get the auth sheet with
// the listing as intent (D-041).

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlistAction } from "@/app/(main)/buy-actions";
import { useGatedNav } from "@/components/shell/use-gated-nav";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { cn } from "@/lib/utils";

export function WishlistHeart({
  listingId,
  initialSaved,
  className,
}: {
  listingId: number;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();
  const { session } = useGatedNav();
  const { open } = useAuthSheet();

  function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      open({ intent: `/listings/${listingId}` });
      return;
    }

    const next = !saved;
    setSaved(next); // optimistic (UX law 6)
    if (next) toast.success("Saved — we'll keep it on your wishlist");
    startTransition(async () => {
      const res = await toggleWishlistAction(listingId);
      if (!res.ok) {
        setSaved(!next); // rollback
        toast.error(res.error);
      }
    });
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      onClick={onToggle}
      className={cn(
        "relative flex size-11 items-center justify-center transition hover:opacity-80 md:size-9",
        className,
      )}
    >
      <span className="relative">
        <Heart
          className="absolute -top-[2px] -right-[2px] size-7 fill-white stroke-white/90 md:size-6"
          strokeWidth={1}
        />
        <Heart
          className={cn(
            "relative size-6 transition-colors md:size-5",
            saved ? "fill-primary stroke-primary" : "fill-neutral-500/70 stroke-neutral-500/70",
          )}
        />
      </span>
    </button>
  );
}
