// Amazon-style department cards: four big entry points into the catalogue.

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const DEPARTMENTS = [
  {
    title: "Textbooks",
    copy: "Class 1–12 · every subject",
    href: "/search?category=textbook",
    image: "/images/books/textbook-stack.webp",
  },
  {
    title: "Reference & guides",
    copy: "Practice sets, question banks",
    href: "/search?category=reference",
    image: "/images/books/reference-desk.webp",
  },
  {
    title: "Competitive exams",
    copy: "JEE, NEET, Olympiad prep",
    href: "/search?category=competitive",
    image: "/images/books/study-stack.webp",
  },
  {
    title: "Novels & stories",
    copy: "Something to read for fun",
    href: "/search?category=novel",
    image: "/images/books/novel-grass.webp",
  },
] as const;

export function Departments() {
  return (
    <section className="mt-12 md:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
            Shop by category
          </p>
          <h2 className="font-display text-ink mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything for your school year
          </h2>
        </div>
        <Link
          href="/search"
          className="text-body hover:text-ink text-sm font-medium transition"
        >
          All categories
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {DEPARTMENTS.map((d) => (
          <Link
            key={d.title}
            href={d.href}
            className="group text-ink relative isolate aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-black/5 sm:aspect-[4/3] lg:aspect-[4/5]"
          >
            <Image
              src={d.image}
              alt=""
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 23vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <div className="from-forest-deep/95 via-forest-deep/35 absolute inset-0 bg-gradient-to-t to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
              <div>
                <p className="font-display text-lg leading-tight font-medium text-white sm:text-xl">
                  {d.title}
                </p>
                <p className="mt-0.5 text-[11px] text-white/65">{d.copy}</p>
              </div>
              <span className="bg-lime-soft/90 text-forest flex size-8 shrink-0 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
