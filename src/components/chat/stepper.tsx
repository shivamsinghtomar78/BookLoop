// Status stepper (D-044) — identical for both sides, derived from server state.
// Chatting → Reserved → Meet at pickup → Done → Rate

import { Check } from "lucide-react";
import type { TxState } from "@/services/transactions";
import { cn } from "@/lib/utils";

const STEPS = ["Chatting", "Reserved", "Meet at pickup", "Done", "Rate"] as const;

export function currentStep(state: TxState): number {
  if (state.confirmed) return state.myRating !== null ? 5 : 4; // Done → Rate
  if (state.reserved) return 2; // Reserved done → "Meet at pickup" active
  return 0; // Chatting
}

export function Stepper({ state }: { state: TxState }) {
  const active = currentStep(state);
  return (
    <ol className="flex items-center gap-1" aria-label="Exchange progress">
      {STEPS.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition",
                done && "bg-primary text-primary-foreground",
                current && "bg-primary-soft text-primary-active ring-primary ring-1",
                !done && !current && "bg-surface-soft text-subtle",
              )}
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            <span
              className={cn(
                "w-full truncate text-center text-[10px] leading-tight",
                current ? "text-foreground font-medium" : "text-subtle",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
