// Dev/demo seed — Task 0.6. Idempotent: wipes dev data, reinserts.
// REFUSES to run against anything that looks like production (Phase 0 test).
// Run: npm run db:seed

import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

// Prod guard: refuse unless explicitly overridden.
const looksLikeProd =
  process.env.VERCEL_ENV === "production" || /prod/i.test(url);
if (looksLikeProd && process.env.SEED_PROD_OK !== "yes") {
  console.error(
    "Refusing to seed: DATABASE_URL looks like production. Set SEED_PROD_OK=yes only if you truly mean it.",
  );
  process.exit(1);
}

const db = drizzle(neon(url), { schema });

const PLACEHOLDER = (seed: string) =>
  `https://picsum.photos/seed/${seed}/600/450`;

async function main() {
  console.log("Seeding BookLoop dev data…");

  // Wipe in FK-safe order (children first)
  await db.delete(schema.ratings);
  await db.delete(schema.transactions);
  await db.delete(schema.messages);
  await db.delete(schema.chats);
  await db.delete(schema.notifications);
  await db.delete(schema.bookAlerts);
  await db.delete(schema.wishlistItems);
  await db.delete(schema.listingPhotos);
  await db.delete(schema.listings);
  await db.delete(schema.users);

  // ---- Users ----
  const [asha, rohan, meera] = await db
    .insert(schema.users)
    .values([
      {
        authId: "seed-asha",
        fullName: "Asha Verma",
        schoolName: "Pilot School",
        age: 14,
        class: 9,
        email: "asha@example.com",
        emailConfirmed: true,
      },
      {
        authId: "seed-rohan",
        fullName: "Rohan Iyer",
        schoolName: "Pilot School",
        age: 13,
        class: 8,
        email: "rohan@example.com",
        emailConfirmed: true,
      },
      {
        authId: "seed-meera",
        fullName: "Meera Khan",
        schoolName: "Pilot School",
        age: 15,
        class: 10,
        email: "meera@example.com",
        emailConfirmed: false,
      },
    ])
    .returning();

  // ---- Listings across all categories & modes ----
  const listingRows = [
    // Textbooks (sell)
    { sellerId: asha.id, title: "Science Textbook — Class 9", category: "textbook", mode: "sell", class: 9, subject: "Science", editionYear: "2025", condition: "good", priceInr: 120 },
    { sellerId: asha.id, title: "Maths Textbook — Class 9", category: "textbook", mode: "sell", class: 9, subject: "Maths", editionYear: "2025", condition: "like_new", priceInr: 150 },
    { sellerId: rohan.id, title: "English Reader — Class 8", category: "textbook", mode: "sell", class: 8, subject: "English", editionYear: "2024", condition: "fair", priceInr: 60 },
    // Reference (sell)
    { sellerId: meera.id, title: "Maths Practice Guide — Class 10", category: "reference", mode: "sell", class: 10, subject: "Maths", editionYear: "2025", condition: "good", priceInr: 180 },
    { sellerId: rohan.id, title: "Science Question Bank — Class 8", category: "reference", mode: "sell", class: 8, subject: "Science", condition: "worn", priceInr: 40 },
    // Competitive (sell)
    { sellerId: meera.id, title: "Physics Problem Book (JEE basics)", category: "competitive", mode: "sell", subject: "Physics", exam: "JEE", condition: "good", priceInr: 250 },
    { sellerId: meera.id, title: "Olympiad Maths Workbook", category: "competitive", mode: "sell", subject: "Maths", exam: "Olympiad", condition: "like_new", priceInr: 200 },
    // Novels (sell)
    { sellerId: asha.id, title: "Adventure Novel (English)", category: "novel", mode: "sell", genre: "Adventure", author: "R. Sharma", condition: "good", priceInr: 90 },
    // Exchange
    { sellerId: rohan.id, title: "Science Textbook — Class 8", category: "textbook", mode: "exchange", class: 8, subject: "Science", condition: "good", wantsBook: "Class 8 Maths" },
    // Donations
    { sellerId: asha.id, title: "Hindi Textbook — Class 9", category: "textbook", mode: "donate", class: 9, subject: "Hindi", condition: "fair" },
    { sellerId: meera.id, title: "Story Collection (Novel)", category: "novel", mode: "donate", genre: "Short stories", condition: "good" },
  ] as const;

  for (const [i, row] of listingRows.entries()) {
    const [inserted] = await db
      .insert(schema.listings)
      .values({ ...row, bookloopId: `BL-${String(i + 1).padStart(4, "0")}` })
      .returning();
    await db.insert(schema.listingPhotos).values([
      { listingId: inserted.id, url: PLACEHOLDER(`book${i + 1}a`), sortOrder: 1 },
      { listingId: inserted.id, url: PLACEHOLDER(`book${i + 1}b`), sortOrder: 2 },
    ]);
  }

  // ---- One chat with messages (Rohan asks Asha about the Science book) ----
  const [firstListing] = await db.select().from(schema.listings).limit(1);
  const [chat] = await db
    .insert(schema.chats)
    .values({ listingId: firstListing.id, buyerId: rohan.id })
    .returning();
  await db.insert(schema.messages).values([
    { chatId: chat.id, senderId: rohan.id, body: "Is this available?" },
    { chatId: chat.id, senderId: asha.id, body: "Yes! I can bring it tomorrow." },
    { chatId: chat.id, senderId: rohan.id, body: "Great — library at lunch break?" },
  ]);

  // ---- A wishlist item and an alert ----
  const [mathsListing] = await db
    .select()
    .from(schema.listings)
    .limit(1)
    .offset(1);
  await db.insert(schema.wishlistItems).values({
    userId: rohan.id,
    listingId: mathsListing.id,
  });
  await db.insert(schema.bookAlerts).values({
    userId: meera.id,
    keyword: "Chemistry",
    category: "competitive",
    subject: "Chemistry",
  });

  console.log(
    `Done: 3 users, ${listingRows.length} listings (+photos), 1 chat (3 messages), 1 wishlist item, 1 alert.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
