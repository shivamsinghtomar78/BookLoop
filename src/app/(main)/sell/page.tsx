// Sell page (Phase 2) — server wrapper: profile for smart defaults,
// optional ?edit=<id> loads an owned listing into the same form (Task 2.7).
// Route is auth-gated by proxy.ts; email confirmation is enforced in the action.

import { redirect } from "next/navigation";
import { SellForm } from "@/components/sell/sell-form";
import { getCurrentUser } from "@/services/users";
import { getOwnedListingForEdit, DomainError } from "@/services/listings";
import type { ListingInput } from "@/lib/zod-schemas";
import { ResendConfirmation } from "@/components/auth/profile-actions";

export const dynamic = "force-dynamic";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/"); // proxy covers this; double-checked server-side

  if (!current.emailConfirmed) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <p className="text-4xl">📬</p>
        <h1 className="text-xl font-bold">Confirm your email first</h1>
        <p className="text-subtle max-w-xs text-sm">
          Check your inbox for the confirmation link — then come back to list
          your book.
        </p>
        <ResendConfirmation />
      </div>
    );
  }

  const { edit } = await searchParams;
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

  return <SellForm sellerClass={current.profile.class} edit={editProps} />;
}
