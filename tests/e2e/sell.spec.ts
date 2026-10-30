// Sell flow: validation, photo upload (the zero-config local path), preview,
// publish, and the listing's after-life on the marketplace.

import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";
import { storageStateFor, RUN_TAG } from "../support/env";
import { getPool, listingByTitle } from "../support/db";
import { gotoHydrated } from "../support/page";

test.use({ storageState: storageStateFor("seller") });

const PHOTO = "artifacts/.tmp/qa-book.jpg";

// The root hydration marker can precede this form's own hydration, and typing
// into an unhydrated form gets wiped when React takes over. Wait for the form.
async function gotoSell(page: import("@playwright/test").Page) {
  await gotoHydrated(page, "/sell");
  await page.locator('form[data-ready="1"]').waitFor({ timeout: 30_000 });
}

async function makePhoto() {
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
    .toFile(PHOTO);
}

test.describe("sell", () => {
  // WebKit's small-viewport emulation makes the photo pipeline slow enough
  // that publish + search can exceed the global 60 s budget.
  test.describe.configure({ timeout: 120_000 });

  test("form refuses to publish a blank book", async ({ page }) => {
    await gotoSell(page);
    await page.getByRole("button", { name: "Preview listing" }).click();
    await expect(
      page.getByText(/Give the book a title|Add at least one photo/).first(),
    ).toBeVisible();
  });

  test("publishes with a compressed local photo", async ({ page, request }) => {
    await makePhoto();
    const title = `${RUN_TAG} ${Date.now().toString(36).slice(-5)}`;
    await gotoSell(page);
    await page.getByLabel("Book title").fill(title);
    await page.getByLabel("Subject").fill("Science");
    await page.getByLabel("Price (₹)").fill("149");
    await page.getByText("Good", { exact: true }).click();

    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    const thumb = page.locator('img[alt="Photo 1"]');
    await expect(thumb).toBeVisible({ timeout: 30_000 });
    // currentSrc is empty until the browser starts loading the image.
    await expect
      .poll(async () => decodeURIComponent(await thumb.evaluate((el) => (el as HTMLImageElement).currentSrc)), {
        timeout: 30_000,
      })
      .toContain("/api/photos/");

    await page.getByRole("button", { name: "Preview listing" }).click();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Your book is live!")).toBeVisible({ timeout: 30_000 });

    const row = await listingByTitle(title);
    expect(row?.status).toBe("active");

    // Photo bytes actually serve, and the card on search finds it.
    const { rows } = await getPool().query<{ url: string }>(
      "select url from listing_photos where listing_id = $1 limit 1",
      [row!.id],
    );
    const photo = await request.get(rows[0].url);
    expect(photo.status()).toBe(200);
    expect(photo.headers()["content-type"]).toBe("image/webp");

    await page.goto("/search?q=" + encodeURIComponent(title));
    await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();
  });
});
