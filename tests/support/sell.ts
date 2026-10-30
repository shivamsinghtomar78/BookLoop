// Shared sell-flow helper for specs that need a fresh, isolated listing.
// (sell.spec.ts keeps its own copy because it also asserts photo serving.)

import { mkdir } from "node:fs/promises";
import sharp from "sharp";
import { expect, type Page } from "@playwright/test";
import { gotoHydrated } from "./page";

export const QA_PHOTO = "artifacts/.tmp/qa-book.jpg";

export async function makePhoto() {
  await mkdir("artifacts/.tmp", { recursive: true });
  await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: "#e3ecf5" },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="1600" height="1200"><rect width="1600" height="1200" fill="#e3ecf5"/><rect x="260" y="180" width="1080" height="840" rx="20" fill="#1f4e79"/><text x="800" y="650" font-family="Arial" font-size="120" fill="#ffffff" text-anchor="middle">QA E2E BOOK</text></svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 86 })
    .toFile(QA_PHOTO);
}

export async function gotoSell(page: Page) {
  await gotoHydrated(page, "/sell");
  await page.locator('form[data-ready="1"]').waitFor({ timeout: 30_000 });
}

/** Publishes a sell-mode book as the signed-in seller and waits for the toast. */
export async function publishBook(page: Page, title: string) {
  await makePhoto();
  await gotoSell(page);
  await page.getByLabel("Book title").fill(title);
  await page.getByLabel("Subject").fill("Science");
  await page.getByLabel("Price (₹)").fill("149");
  await page.getByText("Good", { exact: true }).click();

  await page.locator('input[type="file"]').setInputFiles(QA_PHOTO);
  const thumb = page.locator('img[alt="Photo 1"]');
  await expect(thumb).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(
      async () =>
        decodeURIComponent(
          await thumb.evaluate((el) => (el as HTMLImageElement).currentSrc),
        ),
      { timeout: 30_000 },
    )
    .toContain("/api/photos/");

  await page.getByRole("button", { name: "Preview listing" }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Your book is live!")).toBeVisible({ timeout: 30_000 });
}
