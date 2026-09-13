// Shared Zod schemas — every schema here runs TWICE: client (form feedback)
// and server (the real gate) — ARCHITECTURE.md §4, D-036.
// Phase 1 adds signupSchema/loginSchema; Phase 2 adds the listing schema.

import { z } from "zod";

// Shell exports so the module compiles from Phase 0; extended in later phases.
export const idSchema = z.number().int().positive();

export const bookloopIdSchema = z
  .string()
  .regex(/^BL-\d{4,}$/, "Not a valid BookLoop ID");
