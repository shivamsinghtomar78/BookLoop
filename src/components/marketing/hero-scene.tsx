"use client";

// 3D-ish hero vignette: one student, floating books, and the moments that
// matter — a negotiated price, a donation, a confirmed handover. Pointer
// parallax is mouse-only and disabled for reduced-motion users via CSS.

import Image from "next/image";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Gift, ShieldCheck } from "lucide-react";

export type HeroPhoto = { src: string; alt: string };

export function HeroScene({
  image,
  thumbs,
}: {
  image: string;
  thumbs: HeroPhoto[];
}) {
  const stage = useRef<HTMLDivElement>(null);

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = stage.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
    el.style.setProperty("--px", x.toFixed(3));
    el.style.setProperty("--py", y.toFixed(3));
  }

  function onLeave() {
    const el = stage.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  }

  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
      <div
        aria-hidden
        className="animate-hero-glow absolute -inset-8 -z-10 rounded-[3.5rem] bg-emerald-400/15 blur-3xl"
      />

      <div
        ref={stage}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="hero-tilt relative"
      >
        <div className="animate-hero-rise relative overflow-hidden rounded-[2rem] border border-white/10 bg-forest-deep shadow-[0_60px_140px_-50px_rgba(0,0,0,0.9)]">
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/6]">
            <Image
              src={image}
              alt="A school student sitting on a stack of books while textbooks, a globe and stationery float around them"
              fill
              priority
              sizes="(max-width: 1024px) 92vw, 46vw"
              className="object-cover object-[62%_center] sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/75 via-transparent to-forest/20" />
            <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10" />
          </div>
        </div>

        {/* Negotiation card */}
        <div className="hero-layer absolute top-[12%] -left-1 z-20 w-[13.5rem] sm:-left-7 sm:w-[15rem]">
          <div className="glass-card animate-hero-float rounded-2xl p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-[11px] font-bold text-forest">
                A
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-white">
                  Aarav · Class 9
                </p>
                <p className="text-[9px] text-white/45">Replies in ~2 min</p>
              </div>
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_2px_rgba(110,231,183,0.5)]" />
            </div>
            <div className="mt-2.5 space-y-1.5">
              <p className="w-fit rounded-xl rounded-bl-sm bg-white/12 px-2.5 py-1.5 text-[11px] text-white/90">
                Would ₹150 work?
              </p>
              <p className="ml-auto flex w-fit items-center gap-1 rounded-xl rounded-br-sm bg-lime-soft px-2.5 py-1.5 text-[11px] font-semibold text-forest">
                Deal — ₹150 it is
                <Check className="size-3" />
              </p>
            </div>
          </div>
        </div>

        {/* Donation badge */}
        <div className="hero-layer absolute top-[6%] -right-1 z-20 hidden sm:block">
          <div className="glass-card animate-hero-float-slow flex items-center gap-2 rounded-full px-3 py-2">
            <Gift className="size-3.5 text-lime-soft" />
            <span className="text-[11px] font-semibold text-white">
              Donated free
            </span>
          </div>
        </div>

        {/* Price card */}
        {thumbs[0] && (
          <div className="hero-layer absolute -right-1 bottom-[17%] z-20 w-[10.5rem] sm:-right-6 sm:w-[12rem]">
            <div className="glass-card animate-hero-float rounded-2xl p-2.5 [animation-delay:1.2s]">
              <div className="flex items-center gap-2">
                <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  <Image
                    src={thumbs[0].src}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-white">
                    Mathematics IX
                  </p>
                  <p className="text-[9px] text-white/45">Like new · Class 9</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 border-t border-white/10 pt-2">
                <span className="font-display text-lg leading-none text-white">
                  ₹180
                </span>
                <span className="text-[10px] text-white/35 line-through">
                  ₹240
                </span>
                <span className="ml-auto rounded-full bg-lime-soft/15 px-1.5 py-0.5 text-[9px] font-semibold text-lime-soft">
                  -25%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Handover confirmation */}
        <div className="hero-layer absolute bottom-[5%] -left-2 z-20 hidden sm:block">
          <div className="glass-card animate-hero-float-slow flex items-center gap-2 rounded-xl px-3 py-2 [animation-delay:0.8s]">
            <span className="flex size-7 items-center justify-center rounded-full bg-lime-soft/15">
              <ShieldCheck className="size-3.5 text-lime-soft" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-white">
                Handover confirmed
              </p>
              <p className="text-[9px] text-white/45">Both students rated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
