import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 py-10" : "gap-4 py-14",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "bg-primary-soft text-primary ring-primary/10 flex items-center justify-center rounded-2xl ring-1",
          compact ? "size-11" : "size-14",
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-ink text-[15px] font-semibold">{title}</p>
        {description && (
          <p className="text-subtle mx-auto max-w-xs text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
