// Shared knobs for the QA suite. Everything here is read-only config — no
// secrets, and the database helper refuses Neon hosts so a stray DSN can't
// point the suite at production.

export const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3100";

export const DB_URL =
  process.env.QA_DATABASE_URL ??
  "postgresql://postgres:qa@127.0.0.1:55432/bookloop_qa";

/** Seed accounts (src/db/seed.ts). Testing mode: no email verification. */
export const PASSWORD = "Bookloop!2345";
export const ACCOUNTS = {
  seller: "seller1@test.bookloop.local",
  seller2: "seller2@test.bookloop.local",
  buyer: "buyer1@test.bookloop.local",
  admin: "admin@test.bookloop.local",
} as const;

export type Role = keyof typeof ACCOUNTS;

export const AUTH_DIR = "artifacts/.auth";
export const storageStateFor = (role: Role) => `${AUTH_DIR}/${role}.json`;

/** Every row the suite creates is named with this prefix so teardown can find it. */
export const RUN_TAG = `QA E2E ${process.env.QA_RUN_TAG ?? "run"}`;

export const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
] as const;
