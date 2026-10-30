"use client";

// Mobile: one-line deal status that expands into the full five-step tracker.
// Desktop: the tracker is always visible. Both read from the same server state.

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Stepper } from "@/components/chat/stepper";
import { statusLine } from "@/components/chat/tx-status";
import type { TxState } from "@/services/transactions";
import { cn } from "@/lib/utils";

export function TxTracker({
  state,
  role,
  otherName,
}: {
  state: TxState;
  role: "buyer" | "seller";
  otherName: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const text = statusLine(state, role, otherName);

  return (
    <div className="border-hairline bg-card/60 shrink-0 border-b">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-10 w-full items-center gap-2 px-3 text-left md:hidden"
      >
        <span className="flex-1 truncate text-xs font-medium">{text}</span>
        <ChevronDown
          aria-hidden
          className={cn("text-subtle size-4 shrink-0 transition", open && "rotate-180")}
        />
      </button>
      <div
        id={panelId}
        className={cn("px-3 pb-2 md:block md:px-4", open ? "block pt-2" : "hidden")}
      >
        <p className="text-subtle hidden pb-1.5 text-xs font-medium md:block">
          {text}
        </p>
        <Stepper state={state} showTimes />
      </div>
    </div>
  );
}
