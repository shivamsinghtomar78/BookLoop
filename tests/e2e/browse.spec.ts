// Browse surfaces: home hero, mode tabs, exchange/donate pages.

import { test, expect } from "@playwright/test";

test.describe("home", () => {
  test("hero and browse shelves render without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Give every book/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Find your next book" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("mode tabs re-scope the shelves", async ({ page }) => {
    await page.goto("/?mode=exchange");
    await expect(page).toHaveURL(/\?mode=exchange$/);
    await expect(
      page.getByRole("heading", { name: "Wanted for exchange" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Books for sale" })).toHaveCount(0);
  });

  test("a shelf card opens its detail page", async ({ page }) => {
    await page.goto("/");
    // Home streams many photos; wait for them so the card's box is settled
    // before WebKit's actionability check starts.
    await page.waitForLoadState("networkidle").catch(() => {});
    // The mobile rail and the md+ grid both exist in the DOM; pick the one
    // that is actually on screen at this viewport.
    const first = page.locator('a[href^="/listings/"]:visible').first();
    const href = await first.getAttribute("href");
    expect(href).toMatch(/^\/listings\/\d+$/);
    await first.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await first.click({ timeout: 30_000 });
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
});

test.describe("exchange and donate", () => {
  test("exchange page lists offers or an empty state", async ({ page }) => {
    await page.goto("/exchange");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/exchange/i);
  });

  test("donate page shows free books", async ({ page }) => {
    await page.goto("/donate");
    await expect(page.getByRole("heading", { name: "Free books" })).toBeVisible();
    const freeBadges = page.getByText("FREE", { exact: true });
    const empty = page.getByText("No donations right now");
    await expect(freeBadges.first().or(empty)).toBeVisible();
  });

  test("policies are reachable from the footer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});
    // WebKit's scrollIntoViewIfNeeded waits for the footer to stop moving, and
    // lazy shelf images above it can keep nudging layout. Scroll the DOM
    // directly instead; the link is settled once it's in view.
    const privacy = page.getByRole("contentinfo").getByRole("link", { name: "Privacy" });
    await privacy.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await privacy.click({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
    const terms = page.getByRole("link", { name: "Terms of use" });
    await terms.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await terms.click({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Terms of use" })).toBeVisible();
  });
});
