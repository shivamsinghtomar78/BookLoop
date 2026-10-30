#!/usr/bin/env node
// Preflight before seeding or running Playwright: test DB isolation, required
// keys, a fresh seed marker, and both services healthy. Prints no secrets.
import { assertTestDb, loadTestEnv, TEST_ENV_FILE } from "./lib/test-db.mjs";

const REQUIRED = [
  "UPLOADTHING_TOKEN",
  "BETTER_AUTH_SECRET",
  "CHAT_JWT_SECRET",
  "ADMIN_EMAILS",
];

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const REALTIME = process.env.E2E_REALTIME_URL ?? "http://localhost:4101";

async function health(url, name) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return `${name} returned HTTP ${res.status} (${url})`;
    return null;
  } catch {
    return `${name} is not reachable at ${url}. Start the test stack: npm run test:stack`;
  }
}

async function main() {
  const cfg = await assertTestDb({ quiet: true });
  const env = loadTestEnv();
  const missing = REQUIRED.filter((key) => !process.env[key] && !env.raw[key]);

  if (missing.length) {
    throw new Error(
      `${TEST_ENV_FILE} is missing: ${missing.join(", ")}. Add them before running the suite.`,
    );
  }

  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: cfg.unpooled, max: 1 });
  let seed = null;
  try {
    const { rows } = await pool.query(
      "select label, seeded_at from _bookloop_test_meta order by seeded_at desc limit 1",
    );
    seed = rows[0] ?? null;
  } catch {
    seed = null;
  } finally {
    await pool.end().catch(() => {});
  }

  if (!seed) {
    throw new Error(
      `Test database is not seeded for this QA run. Run: npm run db:test:push && npm run db:test:seed`,
    );
  }
  if (seed.label !== cfg.label) {
    throw new Error(
      `Seed marker belongs to "${seed.label}", but TEST_DB_LABEL is "${cfg.label}". Re-seed before testing.`,
    );
  }

  const ageHours = (Date.now() - new Date(seed.seeded_at).getTime()) / 36e5;
  if (ageHours > 24) {
    console.warn(
      `! seed is ${ageHours.toFixed(1)}h old; re-seed if tests depend on exact listing state.`,
    );
  }

  const failures = (
    await Promise.all([
      health(`${BASE}/api/health`, "web"),
      health(REALTIME, "realtime"),
    ])
  ).filter(Boolean);
  if (failures.length) throw new Error(failures.join("\n"));

  console.log(`✓ preflight: ${cfg.maskedHost} · web ${BASE} · realtime ${REALTIME}`);
}

main().catch((err) => {
  console.error(`\n${err.message}\n`);
  process.exit(1);
});
