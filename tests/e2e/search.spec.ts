// Search and filters — URL is the source of truth, results follow quickly,
// and the empty state always offers a next step.

import { test, expect } from "@playwright/test";
import { gotoHydrated } from "../support/page";

test.describe("search", () => {
  test("typing narrows results and updates the URL", async ({ page }) => {
    await gotoHydrated(page, "/search");
    const input = page.getByPlaceholder("Search books…");
    // Type like a student — WebKit's programmatic fill doesn't drive React's
    // change handler, so a real keystroke stream is the honest test.
    await input.click();
    await input.pressSequentially("Science", { delay: 30 });
    await expect(page).toHaveURL(/q=Science/, { timeout: 10_000 });
    await expect(page.getByRole("link", { name: /Science Textbook/i }).first()).toBeVisible();
  });

  test("filters compose from the URL", async ({ page }) => {
    await page.goto("/search?class=9&category=textbook&mode=sell");
    const cards = page.locator('a[href^="/listings/"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(30);
    // Every card is a Class 9 textbook (cheap check on the visible meta line).
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(cards.nth(i)).toContainText(/Class 9/);
    }
  });

  test("donation filter only shows free books", async ({ page }) => {
    await page.goto("/search?mode=donate");
    const cards = page.locator('a[href^="/listings/"]');
    await expect(cards.first()).toBeVisible();
    const count = Math.min(await cards.count(), 4);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(/FREE|Free/);
    }
  });

  test("no-match state offers an alert instead of a dead end", async ({ page }) => {
    await page.goto("/search?q=zzzz-no-such-book-9999");
    await expect(page.getByText("No match yet")).toBeVisible();
    await expect(page.getByRole("button", { name: /notify me/i })).toBeVisible();
  });

  test("unknown filter values are ignored, not crashed", async ({ page }) => {
    const res = await page.goto("/search?class=99&mode=teleport&price=cheap");
    expect(res?.status()).toBe(200);
    await expect(page.locator('a[href^="/listings/"]').first()).toBeVisible();
  });
});
