"use client";

// My Listings row actions (Task 2.7): edit link + delete with confirm dialog.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteListingAction } from "@/app/(main)/sell/actions";

export function MyListingActions({
  listingId,
  title,
  status,
}: {
  listingId: number;
  title: string;
  status: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      {status === "active" && (
        <Link
          href={`/sell?edit=${listingId}`}
          aria-label={`Edit ${title}`}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
        >
          <Pencil className="size-3.5" />
        </Link>
      )}
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={`Delete ${title}`}
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-3.5" />
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              &quot;{title}&quot; will be removed from BookLoop. This can&apos;t
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const res = await deleteListingAction(listingId);
                if (res.ok) {
                  toast.success("Listing deleted");
                  setConfirming(false);
                  router.refresh();
                } else {
                  toast.error(res.error);
                }
                setBusy(false);
              }}
            >
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
