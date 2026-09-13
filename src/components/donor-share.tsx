"use client";

// Donor share card (Task 5.6) — the feel-good receipt that makes donors donate again.

import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DonorShareButton({ count }: { count: number }) {
  async function share() {
    const text = `🌱 I gave ${count === 1 ? "a book" : `${count} books`} a second life on BookLoop 📚 — one book, many students!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "BookLoop", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied — paste it anywhere");
      }
    } catch {
      /* user cancelled the share sheet */
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share}>
      <Share2 className="size-3.5" /> Share your impact
    </Button>
  );
}
