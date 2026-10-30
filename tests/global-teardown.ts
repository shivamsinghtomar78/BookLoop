// Delete the rows the suite created, then close the shared pool.

import { cleanupRun, closePool } from "./support/db";

export default async function globalTeardown() {
  try {
    if (process.env.QA_KEEP_DATA !== "1") await cleanupRun();
  } finally {
    await closePool();
  }
}
