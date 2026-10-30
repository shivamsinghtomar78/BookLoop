// Listing detail: content, contact privacy, wishlist, missing pages.

import { test, expect } from "@playwright/test";
import { firstListing, getPool } from "../support/db";
import { storageStateFor } from "../support/env";
import { gotoHydrated } from "../support/page";

test.describe("listing detail (guest)", () => {
  test("shows book facts, seller card and the chat action", async ({ page }) => {
    const listing = await firstListing("sell");
    test.skip(!listing, "seed has no active sell listing");
    await gotoHydrated(page, `/listings/${listing!.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(listing!.title);
    await expect(page.getByText(/^BL-/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Chat with Seller/ })).toBeVisible();
    await expect(page.getByText("Handover happens at the school pickup point")).toBeVisible();
  });

  test("never exposes the seller's email or phone", async ({ page }) => {
    const listing = await firstListing("sell");
    test.skip(!listing, "seed has no active sell listing");
    const res = await gotoHydrated(page, `/listings/${listing!.id}`);
    const html = (await res?.text()) ?? "";
    expect(html).not.toContain("@test.bookloop.local");
    expect(html).not.toMatch(/\+91[\s-]?\d{5}/);
  });

  test("chatting as a guest opens the auth sheet", async ({ page }) => {
    const listing = await firstListing("sell");
    test.skip(!listing, "seed has no active sell listing");
    await gotoHydrated(page, `/listings/${listing!.id}`);
    await page.getByRole("button", { name: /Chat with Seller/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByText(/Join BookLoop|Log in/).first()).toBeVisible();
  });

  test("unknown listing shows the styled 404", async ({ page }) => {
    const res = await gotoHydrated(page, "/listings/999999");
    // The route streams its skeleton, so the body is a 404 page while the
    // status can still be 200 — assert the user-visible contract and no 5xx.
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});

test.describe("listing detail (buyer)", () => {
  test.use({ storageState: storageStateFor("buyer") });

  test("wishlist heart toggles and persists", async ({ page }) => {
    const listing = await firstListing("sell");
    test.skip(!listing, "seed has no active sell listing");
    await gotoHydrated(page, `/listings/${listing!.id}`);
    const heart = page.getByRole("button", { name: /Save to wishlist|Remove from wishlist/ });
    const wantPressed = (await heart.getAttribute("aria-pressed")) === "true" ? "false" : "true";
    const toggled = page.getByRole("button", {
      name: wantPressed === "true" ? /Remove from wishlist/ : /Save to wishlist/,
    });

    const committed = page
      .waitForResponse(
        (res) =>
          res.request().method() === "POST" &&
          res.url().includes(`/listings/${listing!.id}`),
        { timeout: 15_000 },
      )
      .catch(() => null);

    await heart.click();
    // The flip is optimistic; a lost pre-hydration click gets one retry.
    try {
      await expect(heart).toHaveAttribute("aria-pressed", wantPressed, { timeout: 3_000 });
    } catch {
      await heart.click();
      await expect(heart).toHaveAttribute("aria-pressed", wantPressed, { timeout: 10_000 });
    }
    // Wait for the server action itself — the optimistic flip can land before
    // the write commits, and reloading too early shows stale state.
    await committed;
    await page.waitForLoadState("networkidle");

    await page.reload();
    await expect(toggled).toBeVisible();

    // Put it back so repeated runs stay deterministic.
    const reverted = page
      .waitForResponse(
        (res) =>
          res.request().method() === "POST" &&
          res.url().includes(`/listings/${listing!.id}`),
        { timeout: 15_000 },
      )
      .catch(() => null);
    await toggled.click();
    await reverted;
    await page.waitForLoadState("networkidle");
  });
});

test.describe("listing detail (seller)", () => {
  test.use({ storageState: storageStateFor("seller") });

  test("own listing has no chat button", async ({ page }) => {
    const listing = await firstListing("sell");
    test.skip(!listing, "seed has no active sell listing");
    const { rows } = await getPool().query<{ email: string }>(
      "select email from users where id = $1",
      [listing!.seller_id],
    );
    test.skip(rows[0]?.email !== "seller1@test.bookloop.local", "first listing is not seller1's");
    await gotoHydrated(page, `/listings/${listing!.id}`);
    await expect(page.getByRole("button", { name: /Chat with Seller/ })).toHaveCount(0);
  });
});
