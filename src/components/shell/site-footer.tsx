// Slim site footer: wayfinding, the promise, and the one-line brand story.

import Link from "next/link";
import { BookOpen } from "lucide-react";

const COLUMNS = [
  {
    title: "Browse",
    links: [
      { label: "All books", href: "/search" },
      { label: "Textbooks", href: "/search?category=textbook" },
      { label: "Exchange", href: "/exchange" },
      { label: "Free donations", href: "/donate" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "List a book", href: "/sell" },
      { label: "Your chats", href: "/chats" },
      { label: "Your profile", href: "/profile" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "School-only network", href: "/#browse" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-hairline bg-surface-soft/70 mt-16 border-t pb-20 md:pb-0">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="text-ink flex items-center gap-2">
              <span className="bg-primary-soft text-primary flex size-8 items-center justify-center rounded-lg">
                <BookOpen className="size-4" />
              </span>
              <span className="font-display text-lg font-semibold">BookLoop</span>
            </Link>
            <p className="text-subtle mt-3 max-w-xs text-sm leading-relaxed">
              Give every school book a second life. Buy, sell, exchange or
              donate with students from your own school.
            </p>
            <p className="text-subtle mt-3 text-[11px]">
              Free for students · Classes 1–12
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-ink text-xs font-semibold tracking-[0.14em] uppercase">
                {col.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-subtle hover:text-ink text-sm transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-hairline text-subtle mt-8 flex flex-col gap-2 border-t pt-4 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BookLoop · Built for school students</p>
          <p>No phone numbers shared · Meet at the school pickup point</p>
        </div>
      </div>
    </footer>
  );
}
