// Chat layout: full-screen thread on phones, two panes on desktop.

import { test, expect } from "@playwright/test";
import { storageStateFor } from "../support/env";
import { firstChatForBuyer } from "../support/db";
import { gotoHydrated } from "../support/page";

test.use({ storageState: storageStateFor("buyer") });

const PHONE = "chromium-390x844";
const DESKTOP = "chromium-1440x900";

test("phone: the thread fills the screen with a pinned composer", async ({ page }) => {
  test.skip(test.info().project.name !== PHONE, "phone layout runs on 390x844");
  const chat = await firstChatForBuyer("buyer1@test.bookloop.local");
  test.skip(!chat, "seed has no chat for buyer1");

  await gotoHydrated(page, `/chats/${chat!.id}`);
  const screen = page.locator("[data-chat-screen]");
  await expect(screen).toBeVisible();

  const box = await screen.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(389);
  expect(box!.width).toBeLessThanOrEqual(391);

  // No site chrome on the thread.
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveCount(0);
  await expect(page.locator('nav[aria-label="Main"]')).toHaveCount(0);

  // Composer sits inside the visible viewport.
  const composer = page.getByRole("textbox", { name: "Message" });
  const composerBox = await composer.boundingBox();
  expect(composerBox!.y + composerBox!.height).toBeLessThanOrEqual(844);

  // The page itself does not scroll — only the transcript.
  const scrollHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  expect(scrollHeight).toBeLessThanOrEqual(846);

  // The compact tracker expands into the five-step stepper.
  const toggle = page.locator('[data-chat-screen] button[aria-expanded]').first();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('[aria-label="Exchange progress"]')).toBeVisible();
});

test("desktop: conversation list and thread sit side by side", async ({ page }) => {
  test.skip(test.info().project.name !== DESKTOP, "desktop layout runs on 1440x900");
  const chat = await firstChatForBuyer("buyer1@test.bookloop.local");
  test.skip(!chat, "seed has no chat for buyer1");

  await gotoHydrated(page, `/chats/${chat!.id}`);
  const aside = page.locator("aside");
  await expect(aside).toBeVisible();
  const asideBox = await aside.boundingBox();
  expect(asideBox!.width).toBeGreaterThanOrEqual(300);

  const screen = page.locator("[data-chat-screen]");
  const box = await screen.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(asideBox!.width - 1);
  expect(box!.x + box!.width).toBeGreaterThanOrEqual(1439);
});
