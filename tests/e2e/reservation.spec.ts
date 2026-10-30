// Four-gate reservation lifecycle: reserve → buyer accepts → seller hands over
// → buyer confirms. Also asserts nobody can close the deal early.

import { test, expect, type BrowserContext } from "@playwright/test";
import { RUN_TAG, storageStateFor } from "../support/env";
import { dealState, listingByTitle } from "../support/db";
import { gotoHydrated } from "../support/page";
import { publishBook } from "../support/sell";

test.describe.configure({ timeout: 180_000 });

// The default page is the seller; the buyer gets their own context below.
test.use({ storageState: storageStateFor("seller") });

test("a deal needs reserve, acceptance, handover and receipt", async ({
  page,
  browser,
}) => {
  const title = `${RUN_TAG} deal ${Date.now().toString(36).slice(-5)}`;
  await publishBook(page, title);

  const row = await listingByTitle(title);
  expect(row?.status).toBe("active");

  const buyerContext: BrowserContext = await browser.newContext({
    storageState: storageStateFor("buyer"),
  });
  const buyer = await buyerContext.newPage();
  try {
    await gotoHydrated(buyer, `/listings/${row!.id}`);
    await buyer.getByRole("button", { name: /Chat with Seller/ }).click();
    await expect(buyer).toHaveURL(/\/chats\/\d+/, { timeout: 20_000 });
    const chatId = Number(buyer.url().split("/").pop());
    expect(chatId).toBeGreaterThan(0);

    // Gate 1 — seller reserves.
    await gotoHydrated(page, `/chats/${chatId}`);
    await page.getByRole("button", { name: "Reserve for this buyer" }).click();
    await expect
      .poll(async () => {
        const s = await dealState(row!.id);
        return s?.status === "reserved" && s.tx_id ? s : null;
      })
      .not.toBeNull();

    // Reserved is not closed: buyer must accept, seller cannot hand over yet.
    await gotoHydrated(buyer, `/chats/${chatId}`);
    await expect(buyer.getByRole("button", { name: "Confirm received ✓" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "I handed it over" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel", exact: true })).toBeVisible();
    await expect(buyer.getByRole("button", { name: "Accept reservation" })).toBeVisible();

    // Gate 2 — buyer accepts. The deal stays reserved.
    await buyer.getByRole("button", { name: "Accept reservation" }).click();
    await expect
      .poll(async () => (await dealState(row!.id))?.buyer_accepted_at)
      .not.toBeNull();
    const accepted = await dealState(row!.id);
    expect(accepted?.status).toBe("reserved");
    expect(accepted?.buyer_confirmed_at).toBeNull();
    await expect(
      buyer.locator('[aria-label="Exchange progress"] [aria-current="step"]'),
    ).toContainText("Meet at pickup");

    // Gate 3 — seller hands over. The buyer still cannot confirm.
    await gotoHydrated(page, `/chats/${chatId}`);
    await expect(buyer.getByRole("button", { name: "Confirm received ✓" })).toHaveCount(0);
    await page.getByRole("button", { name: "I handed it over" }).click();
    await expect
      .poll(async () => (await dealState(row!.id))?.seller_handed_over_at)
      .not.toBeNull();

    // Gate 4 — buyer confirms; only now does the listing close.
    await gotoHydrated(buyer, `/chats/${chatId}`);
    await expect(buyer.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
    await buyer.getByRole("button", { name: "Confirm received ✓" }).click();
    await expect
      .poll(async () => {
        const s = await dealState(row!.id);
        return s?.status === "closed" && s.buyer_confirmed_at ? s : null;
      })
      .not.toBeNull();

    const done = await dealState(row!.id);
    expect(done!.buyer_accepted_at!.getTime()).toBeGreaterThanOrEqual(
      done!.seller_marked_at!.getTime(),
    );
    expect(done!.seller_handed_over_at!.getTime()).toBeGreaterThanOrEqual(
      done!.buyer_accepted_at!.getTime(),
    );
    expect(done!.buyer_confirmed_at!.getTime()).toBeGreaterThanOrEqual(
      done!.seller_handed_over_at!.getTime(),
    );

    await expect(buyer.getByText("How did it go?")).toBeVisible();
  } finally {
    await buyerContext.close();
  }
});
