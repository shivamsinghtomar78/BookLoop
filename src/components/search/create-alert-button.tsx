"use client";

// Empty-state "Notify me" button (Task 3.5) — creates an alert pre-filled
// from the active filters; guests get the auth sheet first (D-041).

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BellPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAlertAction } from "@/app/(main)/buy-actions";
import { useGatedNav } from "@/components/shell/use-gated-nav";
import { useAuthSheet } from "@/components/auth/auth-sheet";

export function CreateAlertButton() {
  const params = useSearchParams();
  const { session } = useGatedNav();
  const { open } = useAuthSheet();
  const [done, setDone] = useState(false);

  async function create() {
    if (!session) {
      open({ intent: `/search?${params.toString()}` });
      return;
    }
    const cls = params.get("class");
    const res = await createAlertAction({
      keyword: params.get("q") ?? undefined,
      category:
        (params.get("category") as
          | "textbook"
          | "reference"
          | "competitive"
          | "novel"
          | null) ?? undefined,
      class: cls ? Number(cls) : undefined,
      subject: params.get("subject") ?? undefined,
    });
    if (res.ok) {
      setDone(true);
      toast.success("Alert set — we'll notify you when it's listed");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Button size="lg" onClick={create} disabled={done}>
      <BellPlus className="size-4" />
      {done ? "Alert set ✓" : "Notify me when it's listed"}
    </Button>
  );
}
