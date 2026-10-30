// Shared guard for anything that writes to a database during QA.
// Reads .env.test.local only, and refuses unless the URL is demonstrably
// different from the production Neon endpoint in .env.local/.env.
// Never prints connection strings.

import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

export const TEST_ENV_FILE = ".env.test.local";
const PROD_ENV_FILES = [".env.local", ".env"];
const CONFIRM_VALUE = "bookloop-test";

export function readEnvFile(path) {
  if (!existsSync(path)) return {};
  try {
    return parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

export function loadTestEnv() {
  const test = readEnvFile(TEST_ENV_FILE);
  const prod = Object.assign({}, ...PROD_ENV_FILES.map(readEnvFile));
  const pick = (key) => process.env[key] ?? test[key];

  return {
    url: pick("TEST_DATABASE_URL"),
    unpooled: pick("TEST_DATABASE_URL_UNPOOLED") ?? pick("TEST_DATABASE_URL"),
    confirm: pick("TEST_DB_CONFIRM"),
    label: pick("TEST_DB_LABEL"),
    prodUrls: [process.env.PROD_DATABASE_URL, prod.DATABASE_URL].filter(Boolean),
    raw: test,
  };
}

function safeUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function neonEndpoint(parsed) {
  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith(".neon.tech")) return null;
  const first = host.split(".")[0];
  return first.replace(/-pooler$/, "");
}

export function sameDatabase(a, b) {
  const ua = safeUrl(a);
  const ub = safeUrl(b);
  if (!ua || !ub) return false;
  const ea = neonEndpoint(ua);
  const eb = neonEndpoint(ub);
  if (ea && eb) return ea === eb;
  return (
    ua.hostname.toLowerCase() === ub.hostname.toLowerCase() &&
    (ua.port || "5432") === (ub.port || "5432") &&
    ua.pathname === ub.pathname
  );
}

export function maskHost(value) {
  const parsed = safeUrl(value);
  if (!parsed) return "(invalid URL)";
  const host = parsed.hostname;
  const endpoint = neonEndpoint(parsed);
  return endpoint
    ? `${endpoint.slice(0, 7)}…${host.slice(host.indexOf("."))}`
    : host.replace(/^[^.]+/, "…");
}

/**
 * Validate the test database configuration. Throws with an actionable message
 * (never the DSN) when anything is missing or ambiguous.
 */
export async function assertTestDb({ connect = true, quiet = false } = {}) {
  const env = loadTestEnv();
  const problems = [];

  if (!env.url) {
    problems.push(
      `${TEST_ENV_FILE} is missing TEST_DATABASE_URL. Create a Neon branch and add its pooled + unpooled URLs (see the QA plan).`,
    );
  }
  if (env.confirm !== CONFIRM_VALUE) {
    problems.push(`Set TEST_DB_CONFIRM=${CONFIRM_VALUE} in ${TEST_ENV_FILE}.`);
  }
  if (!env.label) {
    problems.push(`Set TEST_DB_LABEL (the Neon branch name) in ${TEST_ENV_FILE}.`);
  } else if (/prod/i.test(env.label)) {
    problems.push("TEST_DB_LABEL looks like a production branch; use the QA branch name.");
  }
  if (env.url) {
    for (const prodUrl of env.prodUrls) {
      if (sameDatabase(env.url, prodUrl)) {
        problems.push(
          "Refusing to continue: TEST_DATABASE_URL resolves to the same Neon endpoint as the production DATABASE_URL.",
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(`Test database guard failed:\n- ${problems.join("\n- ")}`);
  }

  if (connect) {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: env.unpooled ?? env.url });
    try {
      await client.connect();
      await client.query("select 1");
    } finally {
      await client.end().catch(() => {});
    }
  }

  const result = {
    url: env.url,
    unpooled: env.unpooled,
    label: env.label,
    maskedHost: maskHost(env.url),
    raw: env.raw,
  };

  if (!quiet) {
    console.log(
      `✓ test database: ${result.maskedHost} (branch "${result.label}") — isolated from production`,
    );
  }
  return result;
}
