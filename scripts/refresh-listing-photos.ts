// Non-destructive demo photo refresh: replaces legacy picsum / remote
// Unsplash rows with self-hosted book photos matched to each listing's
// category. Real user uploads (UploadThing) are left alone.
//
// Usage: npx tsx scripts/refresh-listing-photos.ts [--dry-run]

import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { eq } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { listingPhotos, listings } from "../src/db/schema";
import { altPhotoFor, photoFor } from "../src/db/seed-photos";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const db = getDb();
  const rows = await db.select().from(listings).orderBy(listings.id);
  let changed = 0;

  for (const [i, listing] of rows.entries()) {
    const photos = await db
      .select()
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, listing.id));
    if (!photos.some((p) => /picsum\.photos|images\.unsplash\.com/.test(p.url)))
      continue;

    const urls = [
      photoFor(listing.category, i),
      altPhotoFor(listing.category, i),
    ];

    if (dryRun) {
      console.log(`[dry] ${listing.bookloopId} ${listing.title} -> ${urls[0]}`);
      changed++;
      continue;
    }

    await db
      .delete(listingPhotos)
      .where(eq(listingPhotos.listingId, listing.id));
    await db.insert(listingPhotos).values(
      urls.map((url, j) => ({
        listingId: listing.id,
        url,
        sortOrder: j + 1,
      })),
    );
    console.log(`${listing.bookloopId} ${listing.title} -> ${urls[0]}`);
    changed++;
  }

  console.log(
    `\n${dryRun ? "[dry run] " : ""}${changed}/${rows.length} listings refreshed.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Photo refresh failed:", err);
    process.exit(1);
  });
