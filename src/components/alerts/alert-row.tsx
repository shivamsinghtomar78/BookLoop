"use client";

// Alert management row (Task 3.5) — deactivate with one tap.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deactivateAlertAction } from "@/app/(main)/buy-actions";

export function AlertRow({
  alertId,
  label,
}: {
  alertId: number;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-card p-3">
      <p className="min-w-0 flex-1 truncate text-sm">🔔 {label}</p>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={`Stop watching for ${label}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await deactivateAlertAction(alertId);
          if (res.ok) {
            toast.success("Alert removed");
            router.refresh();
          } else {
            toast.error(res.error);
            setBusy(false);
          }
        }}
      >
        <BellOff className="size-3.5" />
      </Button>
    </div>
  );
}
