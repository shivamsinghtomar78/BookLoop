"use client";

// Search input — writes q to the URL (debounced), keeping results shareable.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  function push(v: string) {
    const next = new URLSearchParams(params.toString());
    if (v.trim()) next.set("q", v.trim());
    else next.delete("q");
    router.replace(`/search?${next.toString()}`, { scroll: false });
  }

  function onChange(v: string) {
    setValue(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => push(v), 350);
  }

  function clear() {
    if (debounce.current) clearTimeout(debounce.current);
    setValue("");
    push("");
  }

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Search books…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        enterKeyHint="search"
        className="bg-card rounded-full pl-10 [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search books"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="text-subtle hover:bg-surface-soft hover:text-ink absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full transition"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
