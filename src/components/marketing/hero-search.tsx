"use client";

// Amazon-style search dock inside the hero: query + category, plus one-tap
// popular searches. Everything maps to the existing /search filters.

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Search } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "All books" },
  { value: "textbook", label: "Textbooks" },
  { value: "reference", label: "Reference" },
  { value: "competitive", label: "Competitive" },
  { value: "novel", label: "Novels" },
] as const;

const POPULAR = [
  { label: "Class 9 Science", href: "/search?class=9&subject=Science" },
  { label: "JEE prep", href: "/search?category=competitive&exam=JEE" },
  { label: "Free books", href: "/search?mode=donate" },
  { label: "Novels under ₹100", href: "/search?category=novel&price=u100" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    router.push(`/search${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="order-2 mt-10 lg:order-3 lg:col-span-2 lg:mt-14">
      <form
        onSubmit={submit}
        className="glass-card mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:rounded-full"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
          <Search className="size-4 shrink-0 text-white/45" aria-hidden />
          <span className="sr-only">Search books</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, subject, class or exam…"
            className="h-11 w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </label>

        <div className="flex gap-2 sm:contents">
          <label className="min-w-0 flex-1 sm:border-l sm:border-white/10">
            <span className="sr-only">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full cursor-pointer rounded-full bg-transparent px-3 text-sm text-white/80 focus:outline-none sm:w-auto [&>option]:bg-forest [&>option]:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="bg-lime-soft text-forest hover:bg-[#d6fbe6] inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-semibold transition"
          >
            Search
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      <div className="no-scrollbar mx-auto mt-3 flex max-w-3xl gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:justify-center">
        <span className="text-[11px] text-white/35 self-center">Popular:</span>
        {POPULAR.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => router.push(p.href)}
            className="shrink-0 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] text-white/65 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
