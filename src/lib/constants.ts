// BookLoop domain constants — single source of truth for UI + validation.
// Values trace to docs/DECISIONS.md (D-003 taxonomy, D-006 conditions, D-039 limits).

export const CATEGORIES = [
  { value: "textbook", label: "Textbook" },
  { value: "reference", label: "Reference / Guide" },
  { value: "competitive", label: "Competitive exam" },
  { value: "novel", label: "Novel / Other" },
] as const;

export const MODES = [
  { value: "sell", label: "Sell" },
  { value: "exchange", label: "Exchange" },
  { value: "donate", label: "Donate" },
] as const;

export const CONDITIONS = [
  {
    value: "like_new",
    label: "Like New",
    hint: "No marks, looks unused",
  },
  {
    value: "good",
    label: "Good",
    hint: "Minor wear, no missing pages",
  },
  {
    value: "fair",
    label: "Fair",
    hint: "Visible wear or some writing, fully usable",
  },
  {
    value: "worn",
    label: "Worn",
    hint: "Heavy wear, but complete and readable",
  },
] as const;

export const EXAMS = ["JEE", "NEET", "Olympiad", "Other"] as const;

export const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);

// Abuse caps — enforced in services with DB counts (D-039)
export const LIMITS = {
  maxActiveListingsPerUser: 20,
  maxNewChatsPerDay: 10,
  minSecondsBetweenMessages: 1,
  maxPhotosPerListing: 4,
  minPasswordLength: 8,
  maxPriceInr: 9999,
} as const;

// Reservation auto-expiry — lazy check on read (D-043)
export const RESERVATION_EXPIRY_HOURS = 72;

export const BOOKLOOP_ID_PREFIX = "BL-";
