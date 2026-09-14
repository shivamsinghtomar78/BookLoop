// Book-drive bulk import (Task 6.6, D-011): spreadsheet CSV → live listings
// under a "BookLoop Drive" account, so launch day starts with full shelves.
//
// Usage:
//   npx tsx scripts/book-drive-import.ts <file.csv> [--dry-run]
//
// CSV columns (see docs/book-drive-template.csv):
//   title,category,mode,class,subject,exam,genre,author,edition_year,
//   condition,price_inr,wants_book,photo_url
// photo_url optional — a neutral placeholder is used when empty (replace with
// real photos before launch where possible; the photo IS the listing).

import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { photoFor } from "../src/db/seed-photos";

const DRIVE_EMAIL = "bookdrive@school.local";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(","); // pilot-simple: no embedded commas in fields
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  const dryRun = flags.includes("--dry-run");
  if (!file) {
    console.error("Usage: npx tsx scripts/book-drive-import.ts <file.csv> [--dry-run]");
    process.exit(1);
  }

  const { getDb } = await import("../src/db/client");
  const { users } = await import("../src/db/schema");
  const { createListing } = await import("../src/services/listings");
  const { listingSchema } = await import("../src/lib/zod-schemas");
  const db = getDb();

  // Get-or-create the drive account (profile only — nobody logs into it)
  let [drive] = await db.select().from(users).where(eq(users.email, DRIVE_EMAIL));
  if (!drive && !dryRun) {
    [drive] = await db
      .insert(users)
      .values({
        authId: "book-drive",
        fullName: "BookLoop Drive",
        schoolName: "Pilot School",
        age: 18,
        class: 12,
        email: DRIVE_EMAIL,
        emailConfirmed: true,
      })
      .returning();
  }

  const rows = parseCsv(readFileSync(file, "utf8"));
  let ok = 0;
  const errors: string[] = [];

  for (const [i, r] of rows.entries()) {
    const input = {
      title: r.title,
      category: r.category as "textbook" | "reference" | "competitive" | "novel",
      mode: (r.mode || "sell") as "sell" | "exchange" | "donate",
      condition: (r.condition || "good") as "like_new" | "good" | "fair" | "worn",
      conditionNote: "",
      // Real photos strongly preferred (the photo IS the listing) —
      // fallback is a real book photo from the verified pool, not a placeholder.
      photos: [r.photo_url || photoFor(r.category || "generic", i)],
      class: r.class ? Number(r.class) : null,
      subject: r.subject || "",
      exam: r.exam || "",
      genre: r.genre || "",
      author: r.author || "",
      editionYear: r.edition_year || "",
      priceInr: r.price_inr ? Number(r.price_inr) : null,
      wantsBook: r.wants_book || "",
    };

    const parsed = listingSchema.safeParse(input);
    if (!parsed.success) {
      errors.push(`row ${i + 2} ("${r.title}"): ${parsed.error.issues[0]?.message}`);
      continue;
    }
    if (!dryRun) {
      // skipLimit: the drive account legitimately holds 100+ listings (D-011)
      const created = await createListing(parsed.data, drive!.id, { skipLimit: true });
      console.log(`  ${created.bookloopId}  ${r.title}`);
    }
    ok++;
  }

  console.log(
    `\n${dryRun ? "[dry run] " : ""}${ok}/${rows.length} rows valid${dryRun ? "" : " and imported"}.`,
  );
  if (errors.length) {
    console.log("Skipped:");
    for (const e of errors) console.log("  -", e);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
