// Driver-agnostic atomic write. Neon HTTP has no interactive transactions but
// supports db.batch; node-postgres (local/CI) supports transactions. Callers
// pass both descriptions of the same write so either driver gives all-or-nothing
// semantics.

import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

type Capable = {
  batch?: (queries: unknown[]) => Promise<unknown>;
  transaction?: (fn: (tx: unknown) => Promise<void>) => Promise<unknown>;
};

export async function atomically(
  db: Db,
  queries: unknown[],
  interactive: (tx: Db) => Promise<void>,
) {
  const driver = db as unknown as Capable;
  if (typeof driver.batch === "function") return driver.batch(queries);
  if (typeof driver.transaction === "function") {
    return driver.transaction((tx) => interactive(tx as Db));
  }
  throw new Error("Database driver supports neither batch nor transactions");
}
