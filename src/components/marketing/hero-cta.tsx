"use client";

// Hero actions. Guests get sign up / log in (the two requested CTAs); authed
// students get straight into browsing or listing.

import Link from "next/link";
import { ArrowDown, ArrowRight, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { useGatedNav } from "@/components/shell/use-gated-nav";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const primaryCls =
  "h-12 rounded-full bg-lime-soft px-6 text-[15px] font-semibold text-forest shadow-[0_20px_45px_-20px_rgba(186,245,212,0.75)] hover:bg-[#d6fbe6] focus-visible:ring-lime-soft/40";

const secondaryCls =
  "h-12 rounded-full border-white/20 bg-white/5 px-6 text-[15px] text-white hover:border-white/30 hover:bg-white/10 hover:text-white";

export function HeroCta() {
  const { data: session } = useSession();
  const { open } = useAuthSheet();
  const { gatedGo } = useGatedNav();

  if (session) {
    return (
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="#browse" className={cn(buttonVariants({ size: "lg" }), primaryCls)}>
          Browse books
          <ArrowRight className="size-4" />
        </Link>
        <Button
          size="lg"
          variant="outline"
          className={secondaryCls}
          onClick={() => gatedGo("/sell")}
        >
          <Plus className="size-4" />
          Sell a book
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Button
        size="lg"
        className={primaryCls}
        onClick={() => open({ mode: "signup" })}
      >
        Join free
        <ArrowRight className="size-4" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        className={secondaryCls}
        onClick={() => open({ mode: "login" })}
      >
        Log in
      </Button>
      <Link
        href="#browse"
        className="ml-1 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
      >
        Browse first
        <ArrowDown className="size-4" />
      </Link>
    </div>
  );
}
