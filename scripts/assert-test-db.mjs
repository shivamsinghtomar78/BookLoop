#!/usr/bin/env node
// CLI entry: fails fast if the configured test DB is missing or could be production.
import { assertTestDb } from "./lib/test-db.mjs";

try {
  await assertTestDb();
} catch (err) {
  console.error(`\n${err.message}\n`);
  process.exit(1);
}
