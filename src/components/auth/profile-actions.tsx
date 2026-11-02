"use client";

// Client pieces of the profile page: guest CTA buttons and logout.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { useSession } from "@/lib/auth-client";
import { signOutAction } from "@/app/(auth)/actions";

export function GuestProfileButtons() {
  const { open } = useAuthSheet();
  return (
    <div className="flex w-full flex-col gap-2">
      <Button size="lg" onClick={() => open({ mode: "signup", intent: "/profile" })}>
        Sign up
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={() => open({ mode: "login", intent: "/profile" })}
      >
        Log in
      </Button>
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const { refetch } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await signOutAction();
        if (res.ok) {
          // Clear the shared client session atom too — without this the header
          // keeps rendering as signed-in (no Log in / Sign up) until a reload.
          await refetch();
          toast.success("Logged out");
          router.push("/");
          router.refresh();
        } else {
          toast.error(res.error);
          setBusy(false);
        }
      }}
    >
      {busy ? "Logging out…" : "Log out"}
    </Button>
  );
}

