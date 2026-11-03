// Home hero: the product promise in one screen — buy, sell, exchange or
// donate within your school, then agree the price in real time.

import { Recycle, ShieldCheck } from "lucide-react";
import { HeroCta } from "@/components/marketing/hero-cta";
import { HeroMarquee } from "@/components/marketing/hero-marquee";
import type { HeroPhoto } from "@/components/marketing/hero-photo";
import { HeroSearch } from "@/components/marketing/hero-search";
import { BookloopHero } from "@/components/marketing/stageshow/BookloopHero";
import type { ImpactStats } from "@/services/impact";

const number = new Intl.NumberFormat("en-IN");

export function Hero({
  stats,
  photos,
}: {
  stats: ImpactStats;
  photos: HeroPhoto[];
}) {
  const counters = [
    { label: "Books live", value: stats.books },
    { label: "Students", value: stats.students },
    { label: "Books rehomed", value: stats.rehomed },
  ];

  return (
    <section className="bleed bg-forest relative isolate overflow-hidden rounded-b-[2rem] text-white md:rounded-b-[2.75rem]">
      <div aria-hidden className="hero-grid absolute inset-0" />
      <div
        aria-hidden
        className="animate-hero-glow absolute -top-40 -left-32 size-[32rem] rounded-full bg-emerald-500/20 blur-[130px]"
      />
      <div
        aria-hidden
        className="absolute -top-28 right-0 size-[28rem] rounded-full bg-lime-300/10 blur-[120px]"
      />
      <div aria-hidden className="hero-noise absolute inset-0" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="animate-hero-rise relative z-10 order-1 max-w-xl">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-soft opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-lime-soft" />
              </span>
              For school students · Classes 1–12
            </span>

            <h1 className="font-display mt-6 text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] font-light tracking-[-0.035em]">
              Give every book
              <span className="mt-1 block">
                <em className="text-gradient-loop italic">a second life.</em>
              </span>
            </h1>

            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/60 sm:text-base">
              Buy, sell, exchange or donate school books with students from your
              own school. Chat in real time, agree a fair price, and hand it over
              at the gate.
            </p>

            <HeroCta />

            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                School-only network
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Recycle className="size-3.5" />
                Reuse over rebuy
              </span>
            </p>

            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {counters.map((c) => (
                <div key={c.label}>
                  <dd className="font-display text-2xl font-semibold text-white sm:text-[1.7rem]">
                    {number.format(c.value)}
                  </dd>
                  <dt className="mt-1 text-[9px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                    {c.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="order-3 lg:order-2">
            <div
              aria-hidden="true"
              inert
              className="bookloop-frame animate-hero-rise relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[2rem] border border-white/10 bg-forest shadow-[0_60px_140px_-50px_rgba(0,0,0,0.9)]"
            >
              <BookloopHero />
            </div>
          </div>
          <HeroSearch />
        </div>

        <HeroMarquee photos={photos} liveCount={stats.books} />
      </div>
    </section>
  );
}
