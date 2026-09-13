"use client";

// Shared intent-gating for both navs (D-041): authed users navigate,
// guests get the auth sheet with the destination stored as intent.

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useAuthSheet } from "@/components/auth/auth-sheet";

export function useGatedNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const { open } = useAuthSheet();

  return {
    session,
    gatedGo(path: string) {
      if (session) router.push(path);
      else open({ intent: path });
    },
  };
}
