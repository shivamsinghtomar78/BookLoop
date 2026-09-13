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
