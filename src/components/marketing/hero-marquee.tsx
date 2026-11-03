// Infinite book rail inside the hero — real covers from live listings,
// duplicated once for a seamless CSS loop and paused on hover.

import Image from "next/image";
import type { HeroPhoto } from "@/components/marketing/hero-photo";

export function HeroMarquee({
  photos,
  liveCount,
}: {
  photos: HeroPhoto[];
  liveCount: number;
}) {
  if (photos.length === 0) return null;

  const group = (ariaHidden: boolean) => (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 gap-3 pr-3"
    >
      {photos.map((p, i) => (
        <div
          key={`${p.src}-${i}`}
          className="group relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)] sm:h-44 sm:w-32"
        >
          <Image
            src={p.src}
            alt={ariaHidden ? "" : p.alt}
            fill
            sizes="128px"
            className="object-cover transition duration-500 ease-out group-hover:scale-110 group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-transparent to-transparent" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-12 md:mt-16">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-white/40 uppercase">
          Fresh from your school
        </p>
        <p className="hidden items-center gap-1.5 text-[10px] font-medium tracking-wide text-white/40 sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-lime-soft" />
          {liveCount} books live
        </p>
      </div>
      <div className="mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="animate-marquee flex w-max hover:[animation-play-state:paused]">
          {group(false)}
          {group(true)}
        </div>
      </div>
    </div>
  );
}
