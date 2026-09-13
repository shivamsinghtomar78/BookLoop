// BookLoop schema — mirrors docs/DATABASE_SCHEMA.md exactly.
// Phase-2 verification columns (student_id, verified) exist from day one (D-029).
// Better Auth creates its own session/account/verification tables — not defined here.

import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------

export const categoryEnum = pgEnum("category", [
  "textbook",
  "reference",
  "competitive",
  "novel",
]);

export const modeEnum = pgEnum("mode", ["sell", "exchange", "donate"]);

export const conditionEnum = pgEnum("condition", [
  "like_new",
  "good",
  "fair",
  "worn",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "reserved",
  "closed",
  "deleted",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "alert_match",
  "chat_message",
  "confirm_handover",
]);

// ---------- Users ----------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  authId: text("auth_id").notNull().unique(), // Better Auth user id
  fullName: text("full_name").notNull(),
  schoolName: text("school_name").notNull(),
  age: integer("age").notNull(),
  class: integer("class").notNull(), // 1–12
  email: text("email").notNull().unique(),
  emailConfirmed: boolean("email_confirmed").notNull().default(false),

  // Phase 2 (full launch) — stay empty in the prototype (D-008, D-029)
  studentId: varchar("student_id", { length: 11 }).unique(),
  verified: boolean("verified").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Listings (all 4 modes — D-028) ----------

export const listings = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    bookloopId: varchar("bookloop_id", { length: 10 }).notNull().unique(),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id),

    title: text("title").notNull(),
    category: categoryEnum("category").notNull(),
    mode: modeEnum("mode").notNull(),

    // Category-dependent fields (nullable; enforced by Zod per category)
    class: integer("class"),
    subject: text("subject"),
    exam: text("exam"),
    genre: text("genre"),
    author: text("author"),
    editionYear: varchar("edition_year", { length: 20 }),

    condition: conditionEnum("condition").notNull(),
    conditionNote: text("condition_note"),

    priceInr: integer("price_inr"), // required for sell; NULL for exchange/donate
    wantsBook: text("wants_book"), // exchange only

    status: listingStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("listings_search_idx").on(t.status, t.category, t.class, t.subject),
    index("listings_seller_idx").on(t.sellerId),
  ],
);

export const listingPhotos = pgTable("listing_photos", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(), // UploadThing URL — never binary in DB
  sortOrder: integer("sort_order").notNull().default(1),
});

// ---------- Chat ----------

export const chats = pgTable(
  "chats",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id),
    buyerId: integer("buyer_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("chats_listing_buyer_uq").on(t.listingId, t.buyerId)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    chatId: integer("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("messages_chat_time_idx").on(t.chatId, t.createdAt)],
);

// ---------- Transactions & ratings ----------

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .unique() // one closure per listing — race safety (D-039)
    .references(() => listings.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => users.id),
  mode: modeEnum("mode").notNull(),
  priceInr: integer("price_inr"),
  sellerMarkedAt: timestamp("seller_marked_at").notNull().defaultNow(),
  buyerConfirmedAt: timestamp("buyer_confirmed_at"), // NULL until buyer confirms
});

export const ratings = pgTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactions.id),
    raterId: integer("rater_id")
      .notNull()
      .references(() => users.id),
    rateeId: integer("ratee_id")
      .notNull()
      .references(() => users.id),
    thumbsUp: boolean("thumbs_up").notNull(),
  },
  (t) => [uniqueIndex("ratings_tx_rater_uq").on(t.transactionId, t.raterId)],
);

// ---------- Wishlist & notify-me alerts ----------

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("wishlist_user_listing_uq").on(t.userId, t.listingId)],
);

export const bookAlerts = pgTable("book_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  keyword: text("keyword"),
  category: categoryEnum("category"),
  class: integer("class"),
  subject: text("subject"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- In-app notifications ----------

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    type: notificationTypeEnum("type").notNull(),
    text: text("text").notNull(),
    listingId: integer("listing_id").references(() => listings.id),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);
