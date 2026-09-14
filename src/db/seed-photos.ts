// Real book photos for seed/demo data (replaces picsum placeholders).
// Source: Unsplash CDN — photographs of physical books; the Unsplash license
// permits free use, and every URL below was verified live (HTTP 200,
// image/jpeg) on 14 Sep 2026. Category grouping is cosmetic; photoFor()
// cycles deterministically so reseeds are stable.

const Q = "?w=800&q=70&auto=format&fit=crop";
const u = (id: string) => `https://images.unsplash.com/${id}${Q}`;

export const BOOK_PHOTOS: Record<string, string[]> = {
  textbook: [
    u("photo-1497633762265-9d179a990aa6"), // stack of textbooks
    u("photo-1543002588-bfa74002ed7e"),    // book stack, plain background
    u("photo-1481627834876-b7833e8f5570"), // row of books
  ],
  reference: [
    u("photo-1524995997946-a1c2e315a42f"), // books + notes on desk
    u("photo-1456513080510-7bf3a84b82f8"), // workbook + pencil
  ],
  competitive: [
    u("photo-1509266272358-7701da638078"), // study notes/notebook
    u("photo-1532012197267-da84d127e765"), // hardback close-up
  ],
  novel: [
    u("photo-1544947950-fa07a98d237f"),    // open book on table
    u("photo-1512820790803-83ca734da794"), // open book, warm light
    u("photo-1476275466078-4007374efbbe"), // open book pages
    u("photo-1519682337058-a94d519337bc"), // book in soft light
  ],
  generic: [
    u("photo-1507842217343-583bb7270b66"), // library shelves
  ],
};

const ALL = Object.values(BOOK_PHOTOS).flat();

/** Deterministic category-appropriate picker; falls back to the whole pool. */
export function photoFor(category: string, i: number): string {
  const pool = BOOK_PHOTOS[category] ?? ALL;
  return pool[i % pool.length];
}

/** A second, different photo for variety on the same listing. */
export function altPhotoFor(category: string, i: number): string {
  const pool = BOOK_PHOTOS[category] ?? ALL;
  if (pool.length < 2) return ALL[i % ALL.length];
  return pool[(i + 1) % pool.length];
}
