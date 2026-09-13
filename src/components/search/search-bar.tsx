"use client";

// Search input — writes q to the URL (debounced), keeping results shareable.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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

  function onChange(v: string) {
    setValue(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (v.trim()) next.set("q", v.trim());
      else next.delete("q");
      router.replace(`/search?${next.toString()}`, { scroll: false });
    }, 350);
  }

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Search books…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full pl-9"
        aria-label="Search books"
      />
    </div>
  );
}
