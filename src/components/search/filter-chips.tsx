"use client";

// Filter chips (Task 3.2, WORKFLOW.md §3): removable chips, no apply button,
// state lives in the URL (shareable results — UI_REFERENCE.md §6.5).
// Active chip = green underline via border color swap — no layout shift.

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { CATEGORIES, CLASSES, CONDITIONS, EXAMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MODE_TABS = [
  { value: "", label: "All" },
  { value: "sell", label: "Buy" },
  { value: "exchange", label: "Exchange" },
  { value: "donate", label: "Free" },
] as const;

const PRICE_PRESETS = [
  { value: "u100", label: "Under ₹100" },
  { value: "100to200", label: "₹100–200" },
  { value: "o200", label: "₹200+" },
] as const;

function Chip({
  active,
  onClick,
  children,
  removable,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  removable?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-1 border-b-2 px-3 text-sm font-medium transition",
        active
          ? "border-b-primary text-foreground"
          : "border-b-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && removable && <X className="size-3.5" />}
    </button>
  );
}

export function FilterChips() {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || params.get(key) === value) next.delete(key);
    else next.set(key, value);
    router.replace(`/search?${next.toString()}`, { scroll: false });
  }

  const mode = params.get("mode") ?? "";
  const category = params.get("category");
  const cls = params.get("class");
  const condition = params.get("condition");
  const price = params.get("price");
  const exam = params.get("exam");

  return (
    <div className="flex flex-col gap-1">
      {/* Mode tabs — mirror the Home tabs (D-049) */}
      <div className="-mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {MODE_TABS.map((m) => (
          <Chip
            key={m.value}
            active={mode === m.value}
            onClick={() => setParam("mode", m.value || null)}
          >
            {m.label}
          </Chip>
        ))}
      </div>

      {/* Category + class + condition + price rows */}
      <div className="-mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={category === c.value}
            onClick={() => setParam("category", c.value)}
            removable
          >
            {c.label}
          </Chip>
        ))}
        {category === "competitive" &&
          EXAMS.map((e) => (
            <Chip
              key={e}
              active={exam === e}
              onClick={() => setParam("exam", e)}
              removable
            >
              {e}
            </Chip>
          ))}
      </div>

      <div className="-mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {CLASSES.map((c) => (
          <Chip
            key={c}
            active={cls === String(c)}
            onClick={() => setParam("class", String(c))}
            removable
          >
            Class {c}
          </Chip>
        ))}
      </div>

      <div className="-mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {CONDITIONS.map((c) => (
          <Chip
            key={c.value}
            active={condition === c.value}
            onClick={() => setParam("condition", c.value)}
            removable
          >
            {c.label}
          </Chip>
        ))}
        {PRICE_PRESETS.map((p) => (
          <Chip
            key={p.value}
            active={price === p.value}
            onClick={() => setParam("price", p.value)}
            removable
          >
            {p.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
