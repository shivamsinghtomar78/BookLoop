"use client";

// "Report a problem" (Task 6.8) — the pilot's feedback channel.

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reportProblemAction } from "@/app/(main)/feedback-actions";

export function ReportProblem() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquareWarning className="size-3.5" /> Report a problem
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a problem</DialogTitle>
            <DialogDescription>
              Something broken or confusing? Tell us — it goes straight to the
              BookLoop team.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="What happened?"
            aria-label="Describe the problem"
            className="border-input w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || body.trim().length < 5}
              onClick={async () => {
                setBusy(true);
                const res = await reportProblemAction(body, pathname);
                if (res.ok) {
                  toast.success("Thanks — we'll look into it");
                  setBody("");
                  setOpen(false);
                } else {
                  toast.error(res.error);
                }
                setBusy(false);
              }}
            >
              {busy ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
