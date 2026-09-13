"use client";

// "Add BookLoop to your home screen" (Task 6.1) — shows only when the browser
// fires beforeinstallprompt (Chromium); dismissible, remembered per device.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "bookloop-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* storage blocked — just don't show */
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDeferred(null);
  }

  return (
    <div className="border-hairline bg-card mt-4 flex items-center gap-3 rounded-2xl border p-3">
      <span className="text-2xl">📲</span>
      <p className="min-w-0 flex-1 text-sm">
        Add <span className="font-semibold">BookLoop</span> to your home screen
        — it works like an app.
      </p>
      <Button
        size="sm"
        onClick={async () => {
          await deferred.prompt();
          dismiss();
        }}
      >
        Add
      </Button>
      <button type="button" aria-label="Dismiss" onClick={dismiss} className="text-subtle p-1">
        <X className="size-4" />
      </button>
    </div>
  );
}
