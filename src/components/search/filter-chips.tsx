"use client";

// Discovery toolbar (Task 3.2, WORKFLOW.md §3): a segmented mode control, the
// active filters as removable pills, and one filter panel that holds the full
// taxonomy. State stays in the URL, so every result view is shareable.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function Option({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-10 items-center justify-center gap-1 rounded-full border px-3.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary-soft text-primary-active"
          : "border-hairline bg-card text-body hover:border-ink/20 hover:text-ink",
        className,
      )}
    >
      {active && <Check className="size-3.5" />}
      {children}
    </button>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-subtle text-[11px] font-semibold tracking-[0.14em] uppercase">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export function FilterChips() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || params.get(key) === value) next.delete(key);
    else next.set(key, value);
    router.replace(`/search?${next.toString()}`, { scroll: false });
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    for (const key of ["mode", "category", "exam", "class", "condition", "price"]) {
      next.delete(key);
    }
    router.replace(`/search?${next.toString()}`, { scroll: false });
  }

  const mode = params.get("mode") ?? "";
  const category = params.get("category");
  const cls = params.get("class");
  const condition = params.get("condition");
  const price = params.get("price");
  const exam = params.get("exam");

  const activePills = [
    category && {
      key: "category",
      label: CATEGORIES.find((c) => c.value === category)?.label ?? category,
    },
    exam && { key: "exam", label: exam },
    cls && { key: "class", label: `Class ${cls}` },
    condition && {
      key: "condition",
      label: CONDITIONS.find((c) => c.value === condition)?.label ?? condition,
    },
    price && {
      key: "price",
      label: PRICE_PRESETS.find((p) => p.value === price)?.label ?? price,
    },
  ].filter(Boolean) as { key: string; label: string }[];

  const activeCount = activePills.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className="bg-surface-soft flex flex-1 rounded-full p-1 sm:flex-none"
          role="group"
          aria-label="Listing type"
        >
          {MODE_TABS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={mode === m.value}
              onClick={() => setParam("mode", m.value || null)}
              className={cn(
                "min-h-9 flex-1 rounded-full px-3 text-[13px] font-medium transition sm:flex-none sm:px-5 sm:text-sm",
                mode === m.value
                  ? "bg-card text-ink shadow-sm"
                  : "text-subtle hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="border-hairline bg-card h-11 shrink-0 gap-2 rounded-full px-4"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {activePills.length > 0 && (
        <div className="-mt-0.5 flex flex-wrap items-center gap-1.5">
          {activePills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setParam(p.key, null)}
              className="border-hairline bg-card text-body hover:border-ink/25 hover:text-ink inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition"
            >
              {p.label}
              <X className="size-3 opacity-50" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-subtle hover:text-ink ml-1 text-xs font-medium underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[86dvh] gap-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
            <DialogDescription>
              Narrow the shelf. Results update as you choose.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-1 flex max-h-[56dvh] flex-col gap-5 overflow-y-auto px-1 py-0.5">
            <FilterGroup title="Category">
              {CATEGORIES.map((c) => (
                <Option
                  key={c.value}
                  active={category === c.value}
                  onClick={() => setParam("category", c.value)}
                >
                  {c.label}
                </Option>
              ))}
            </FilterGroup>

            {category === "competitive" && (
              <FilterGroup title="Exam">
                {EXAMS.map((e) => (
                  <Option
                    key={e}
                    active={exam === e}
                    onClick={() => setParam("exam", e)}
                  >
                    {e}
                  </Option>
                ))}
              </FilterGroup>
            )}

            <FilterGroup title="Class">
              {CLASSES.map((c) => (
                <Option
                  key={c}
                  active={cls === String(c)}
                  onClick={() => setParam("class", String(c))}
                  className="min-w-11 px-0"
                >
                  {c}
                </Option>
              ))}
            </FilterGroup>

            <FilterGroup title="Condition">
              {CONDITIONS.map((c) => (
                <Option
                  key={c.value}
                  active={condition === c.value}
                  onClick={() => setParam("condition", c.value)}
                >
                  {c.label}
                </Option>
              ))}
            </FilterGroup>

            <FilterGroup title="Price">
              {PRICE_PRESETS.map((p) => (
                <Option
                  key={p.value}
                  active={price === p.value}
                  onClick={() => setParam("price", p.value)}
                >
                  {p.label}
                </Option>
              ))}
            </FilterGroup>
          </div>

          <div className="border-hairline flex items-center justify-between gap-2 border-t pt-4">
            <Button
              variant="ghost"
              onClick={clearAll}
              disabled={activeCount === 0 && !mode}
              className="text-subtle"
            >
              Clear all
            </Button>
            <Button onClick={() => setOpen(false)} className="min-w-32">
              Show results
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
