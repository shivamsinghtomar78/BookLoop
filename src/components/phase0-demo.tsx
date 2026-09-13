"use client";

// Task 0.2 test rig: primary button (loop green), sheet (300ms slide + scrim),
// toast — all on one screen. Removed when the real shell lands in Phase 1.

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Phase0Demo() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        size="lg"
        className="w-full"
        onClick={() => toast.success("Tokens are live — loop green ✓")}
      >
        Fire a toast
      </Button>
      <Sheet>
        <SheetTrigger
          render={<Button variant="outline" size="lg" className="w-full" />}
        >
          Open a sheet
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Sheet works</SheetTitle>
            <SheetDescription>
              Slide-up + fade over the dark scrim — the signup sheet will live
              here in Phase 1.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}
