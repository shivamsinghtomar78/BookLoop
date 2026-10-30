// Schema push for the QA Neon branch only. The npm script runs
// scripts/assert-test-db.mjs first; this file additionally refuses any URL
// that does not come from TEST_DATABASE_URL_UNPOOLED.
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.test.local" });

const url = process.env.TEST_DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error(
    "TEST_DATABASE_URL_UNPOOLED is not set in .env.test.local — refusing to push.",
  );
}

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
