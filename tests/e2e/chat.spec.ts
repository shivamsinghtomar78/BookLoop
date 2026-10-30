// Chat: gated entry, message send, privacy between participants.

import { test, expect } from "@playwright/test";
import { firstListingBySeller, getPool } from "../support/db";
import { storageStateFor } from "../support/env";
import { gotoHydrated } from "../support/page";

test.use({ storageState: storageStateFor("buyer") });

test("opening a chat and sending a message", async ({ page }) => {
  const listing = await firstListingBySeller("seller1@test.bookloop.local");
  test.skip(!listing, "seed has no active listing for seller1");

  await gotoHydrated(page, `/listings/${listing!.id}`);
  await page.getByRole("button", { name: /Chat with Seller/ }).click();
  await expect(page).toHaveURL(/\/chats\/\d+/, { timeout: 20_000 });

  const body = `QA E2E ping ${Date.now().toString(36)}`;
  await page.getByRole("textbox", { name: "Message" }).fill(body);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(body)).toBeVisible({ timeout: 15_000 });

  const html = await page.content();
  expect(html).not.toMatch(/\+91[\s-]?\d{5}/);
  expect(html).not.toContain("@test.bookloop.local");

  await getPool().query("delete from messages where body = $1", [body]);
});

test("a third student cannot open someone else's chat", async ({ page, browser }) => {
  const listing = await firstListingBySeller("seller1@test.bookloop.local");
  test.skip(!listing, "seed has no active listing for seller1");

  await gotoHydrated(page, `/listings/${listing!.id}`);
  await page.getByRole("button", { name: /Chat with Seller/ }).click();
  await expect(page).toHaveURL(/\/chats\/\d+/);
  const chatId = page.url().split("/").pop()!;

  const intruder = await browser.newContext({
    storageState: storageStateFor("seller2"),
  });
  const other = await intruder.newPage();
  await other.goto(`/chats/${chatId}`);
  await expect(other.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await intruder.close();
});
