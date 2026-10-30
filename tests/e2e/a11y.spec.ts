// Accessibility gate (WCAG 2.1 A/AA) — fails on critical or serious findings,
// which is what an axe run can decide reliably and what blocks real students.

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { firstListing } from "../support/db";
import { storageStateFor } from "../support/env";
import { waitHydrated } from "../support/page";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectAccessible(page: Page, path: string) {
  await page.goto(path);
  await waitHydrated(page);
  await page.waitForLoadState("networkidle").catch(() => {});
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    blocking.map((v) => `${v.id} [${v.impact}] ${v.nodes.length} node(s): ${v.nodes[0]?.target?.join(" ")}`),
  ).toEqual([]);
}

test.describe("public pages", () => {
  for (const path of ["/", "/search", "/exchange", "/donate", "/privacy", "/terms"]) {
    test(`${path} has no serious a11y violations`, async ({ page }) => {
      await expectAccessible(page, path);
    });
  }

  test("listing detail has no serious a11y violations", async ({ page }) => {
    const listing = await firstListing("sell");
    test.skip(!listing, "seed has no active sell listing");
    await expectAccessible(page, `/listings/${listing!.id}`);
  });
});

test.describe("signed-in pages", () => {
  test.use({ storageState: storageStateFor("seller") });

  for (const path of ["/sell", "/profile", "/chats"]) {
    test(`${path} has no serious a11y violations`, async ({ page }) => {
      await expectAccessible(page, path);
    });
  }
});
