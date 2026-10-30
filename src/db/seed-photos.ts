// Real book photos for seed/demo data. Self-hosted WebP copies of Unsplash
// photographs (free to use under the Unsplash license) — no third-party CDN
// dependency at runtime, and no image-optimizer timeouts during a demo.
// Category grouping is cosmetic; photoFor() cycles deterministically so
// reseeds are stable.

const p = (name: string) => `/images/books/${name}.webp`;

export const BOOK_PHOTOS: Record<string, string[]> = {
  textbook: [
    p("textbook-stack"), // stack of school textbooks
    p("books-in-hand"), // hand holding a stack of books
    p("open-book-stack"), // open book resting on a stack
  ],
  reference: [
    p("reference-desk"), // open reference books on a desk
    p("study-stack"), // stack of study books
    p("open-book-stack"), // open book close-up
  ],
  competitive: [
    p("study-stack"), // stack of exam-prep books
    p("library-shelves"), // library shelves
    p("notes-workbook"), // notes and workbook
  ],
  novel: [
    p("milk-and-honey"), // poetry collection on a table
    p("novel-grass"), // open novel in grass
    p("pink-books"), // pink book collection
    p("books-in-hand"), // books in soft light
  ],
  generic: [p("library-shelves"), p("study-stack")],
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

/** Immersive hero marquee — one book photo per curated slot. */
export const HERO_BOOK_PHOTOS = [
  BOOK_PHOTOS.textbook[0],
  BOOK_PHOTOS.novel[0],
  BOOK_PHOTOS.reference[0],
  BOOK_PHOTOS.competitive[0],
  BOOK_PHOTOS.novel[1],
  BOOK_PHOTOS.textbook[1],
  BOOK_PHOTOS.reference[1],
  BOOK_PHOTOS.novel[2],
];
