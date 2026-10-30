// Status stepper (D-044) — identical for both sides, derived from server state.
// Chatting → Reserved → Meet at pickup → Done → Rate. Steps tick only when the
// matching action happened (reserve, accept, hand over, confirm, rate).

import { Check } from "lucide-react";
import type { TxState } from "@/services/transactions";
import { STEPS, currentStep, stepTimes } from "@/components/chat/tx-status";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function Stepper({
  state,
  showTimes = false,
}: {
  state: TxState;
  showTimes?: boolean;
}) {
  const active = currentStep(state);
  const times = stepTimes(state);
  return (
    <ol className="flex items-start gap-1" aria-label="Exchange progress">
      {STEPS.map((label, i) => {
        const done = i < active;
        const current = i === active;
        const at = showTimes ? times[i] : null;
        return (
          <li
            key={label}
            aria-current={current ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
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
            {at && (
              <time
                dateTime={at}
                suppressHydrationWarning
                className="text-subtle w-full truncate text-center text-[9px] leading-tight"
              >
                {formatTime(at)}
              </time>
            )}
          </li>
        );
      })}
    </ol>
  );
}
