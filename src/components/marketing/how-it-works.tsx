// Three-step explainer in a dark band that mirrors the hero.

import Link from "next/link";
import { ArrowRight, MapPin, MessagesSquare, Search } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Find your book",
    copy: "Search by title, class or exam — or start from your class shelf.",
  },
  {
    icon: MessagesSquare,
    title: "Chat & agree",
    copy: "Message the seller, make an offer, settle the price in real time.",
  },
  {
    icon: MapPin,
    title: "Meet at school",
    copy: "Hand it over at the library, confirm in the app, done.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-forest-deep relative isolate mt-12 scroll-mt-24 overflow-hidden rounded-[2rem] px-5 py-8 text-white sm:px-8 md:mt-16 md:px-10 md:py-12"
    >
      <div aria-hidden className="hero-grid absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="absolute -top-24 -right-16 size-72 rounded-full bg-emerald-500/20 blur-[100px]"
      />

      <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-lime-soft/80 uppercase">
            How BookLoop works
          </p>
          <h2 className="font-display mt-2 text-3xl leading-[1.05] font-light tracking-tight sm:text-4xl">
            From shelf to school bag,
            <em className="text-gradient-loop block italic">in three steps.</em>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            No phone numbers, no strangers, no shipping. Just students from your
            own school passing books on.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/sell"
              className="bg-lime-soft text-forest hover:bg-[#d6fbe6] inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-sm font-semibold transition"
            >
              Sell a book
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/search"
              className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Browse books
            </Link>
          </div>
        </div>

        <ol className="flex flex-col gap-2.5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-3.5 rounded-2xl border border-white/8 bg-white/[0.04] p-3.5 backdrop-blur-sm sm:p-4"
            >
              <span className="bg-lime-soft/12 text-lime-soft flex size-10 shrink-0 items-center justify-center rounded-xl">
                <step.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-[10px] font-semibold text-white/30">
                    0{i + 1}
                  </span>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                  {step.copy}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="relative mt-7 border-t border-white/8 pt-4 text-[11px] text-white/35">
        School-only network · No phone numbers shared · Free to use
      </p>
    </section>
  );
}
