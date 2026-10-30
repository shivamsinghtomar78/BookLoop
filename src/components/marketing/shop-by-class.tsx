// Class tiles — the way most students actually start browsing.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);

export function ShopByClass() {
  return (
    <section className="mt-12 md:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
            Shop by class
          </p>
          <h2 className="font-display text-ink mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Books that match your syllabus
          </h2>
        </div>
        <Link
          href="/search"
          className="text-body hover:text-ink text-sm font-medium transition"
        >
          Browse everything
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {CLASSES.map((c) => (
          <Link
            key={c}
            href={`/search?class=${c}`}
            className="group border-hairline bg-card hover:border-primary/35 hover:bg-primary-soft/40 relative flex min-h-20 flex-col justify-between overflow-hidden rounded-xl border p-3 transition"
          >
            <span className="font-display text-ink text-2xl leading-none font-medium">
              {c}
            </span>
            <span className="text-subtle group-hover:text-body flex items-center justify-between text-[11px] font-medium transition">
              Class {c}
              <ArrowRight className="size-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
