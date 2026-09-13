// Sell page (Phase 2) — server wrapper: profile for smart defaults,
// optional ?edit=<id> loads an owned listing into the same form (Task 2.7).
// Route is auth-gated by proxy.ts; email confirmation is enforced in the action.

import { redirect } from "next/navigation";
import { SellForm } from "@/components/sell/sell-form";
import { getCurrentUser } from "@/services/users";
import { getOwnedListingForEdit, DomainError } from "@/services/listings";
import type { ListingInput } from "@/lib/zod-schemas";

export const dynamic = "force-dynamic";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; mode?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/"); // proxy covers this; double-checked server-side

  const { edit, mode } = await searchParams;
  const presetMode = ["sell", "exchange", "donate"].includes(mode ?? "")
    ? (mode as "sell" | "exchange" | "donate")
    : undefined;
  let editProps: { id: number; values: ListingInput } | undefined;

  if (edit) {
    const id = Number(edit);
    if (!Number.isInteger(id)) redirect("/sell");
    try {
      const row = await getOwnedListingForEdit(id, current.profile.id);
      editProps = {
        id,
        values: {
          title: row.title,
          category: row.category,
          mode: row.mode,
          condition: row.condition,
          conditionNote: row.conditionNote ?? "",
          photos: row.photos,
          class: row.class,
          subject: row.subject ?? "",
          exam: row.exam ?? "",
          genre: row.genre ?? "",
          author: row.author ?? "",
          editionYear: row.editionYear ?? "",
          priceInr: row.priceInr,
          wantsBook: row.wantsBook ?? "",
        },
      };
    } catch (err) {
      if (err instanceof DomainError) redirect("/profile");
      throw err;
    }
  }

  return (
    <SellForm
      sellerClass={current.profile.class}
      edit={editProps}
      presetMode={presetMode}
    />
  );
}
