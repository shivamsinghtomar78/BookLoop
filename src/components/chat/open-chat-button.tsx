"use client";

// "Chat with Seller" — the one green action on the listing page, now live.
// Guests get the auth sheet with the listing as intent (D-041).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openChatAction } from "@/app/(main)/chats/chat-actions";
import { useGatedNav } from "@/components/shell/use-gated-nav";
import { useAuthSheet } from "@/components/auth/auth-sheet";

export function OpenChatButton({ listingId }: { listingId: number }) {
  const router = useRouter();
  const { session } = useGatedNav();
  const { open } = useAuthSheet();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!session) {
      open({ intent: `/listings/${listingId}` });
      return;
    }
    setBusy(true);
    const res = await openChatAction(listingId);
    if (res.ok) {
      router.push(`/chats/${res.chatId}`);
    } else {
      toast.error(res.error);
      setBusy(false);
    }
  }

  return (
    <Button size="lg" className="w-full" disabled={busy} onClick={go}>
      💬 {busy ? "Opening chat…" : "Chat with Seller"}
    </Button>
  );
}
