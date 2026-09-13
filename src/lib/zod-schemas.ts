// Shared Zod schemas — every schema here runs TWICE: client (form feedback)
// and server (the real gate) — ARCHITECTURE.md §4, D-036.
// Phase 1 adds signupSchema/loginSchema; Phase 2 adds the listing schema.

import { z } from "zod";

// Shell exports so the module compiles from Phase 0; extended in later phases.
export const idSchema = z.number().int().positive();

export const bookloopIdSchema = z
  .string()
  .regex(/^BL-\d{4,}$/, "Not a valid BookLoop ID");

// ---------- Phase 1: accounts (D-008 Phase-1 fields — no student ID) ----------

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "That name looks too long"),
  schoolName: z
    .string()
    .trim()
    .min(2, "Please enter your school name")
    .max(120, "That school name looks too long"),
  age: z
    .number({ message: "Age must be a number" })
    .int("Age must be a whole number")
    .min(5, "Age must be at least 5")
    .max(19, "Age must be 19 or below"),
  class: z
    .number({ message: "Pick your class" })
    .int()
    .min(1, "Pick your class")
    .max(12, "Pick your class"),
  email: z.string().trim().toLowerCase().email("That email doesn't look right"),
  password: z.string().min(8, "Password needs at least 8 characters"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("That email doesn't look right"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Phase 2: listings (Task 2.3) ----------
// One schema, category/mode-conditional via superRefine — the same rules run
// client-side (form) and server-side (action), D-036.

export const listingSchema = z
  .object({
    title: z.string().trim().min(3, "Give the book a title").max(120),
    category: z.enum(["textbook", "reference", "competitive", "novel"], {
      message: "Pick a category",
    }),
    mode: z.enum(["sell", "exchange", "donate"]),
    condition: z.enum(["like_new", "good", "fair", "worn"], {
      message: "Pick the condition",
    }),
    conditionNote: z.string().trim().max(300).optional().or(z.literal("")),
    photos: z
      .array(z.string().url())
      .min(1, "Add at least one photo")
      .max(4, "Maximum 4 photos"),
    class: z.number().int().min(1).max(12).nullable().optional(),
    subject: z.string().trim().max(60).nullable().optional().or(z.literal("")),
    exam: z.string().trim().max(40).nullable().optional().or(z.literal("")),
    genre: z.string().trim().max(60).nullable().optional().or(z.literal("")),
    author: z.string().trim().max(80).nullable().optional().or(z.literal("")),
    editionYear: z.string().trim().max(20).optional().or(z.literal("")),
    priceInr: z.number().int().nullable().optional(),
    wantsBook: z.string().trim().max(80).optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    const need = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (v.category === "textbook" || v.category === "reference") {
      if (!v.class) need("class", "Pick the class this book is for");
      if (!v.subject) need("subject", "Which subject?");
    }
    if (v.category === "competitive") {
      if (!v.exam) need("exam", "Which exam is this for?");
      if (!v.subject) need("subject", "Which subject?");
    }
    if (v.mode === "sell") {
      if (v.priceInr == null) need("priceInr", "Set a price");
      else if (v.priceInr < 1 || v.priceInr > 9999)
        need("priceInr", "Price must be ₹1–9999");
    }
    if (v.mode === "exchange" && (!v.wantsBook || v.wantsBook.length < 3))
      need("wantsBook", "Which book do you want in exchange?");
  });

export type ListingInput = z.infer<typeof listingSchema>;
