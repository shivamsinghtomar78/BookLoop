// Verifies the zero-config photo path: sign in, upload, publish, serve bytes.
// Runs against the local QA stack (3100 + isolated Postgres). Cleans up after
// itself. Not part of the Playwright suite; a focused smoke while building.

import { chromium } from "playwright-core";
import { Pool } from "pg";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3100";
const DB = process.env.QA_DATABASE_URL ?? "postgresql://postgres:qa@127.0.0.1:55432/bookloop_qa";
const OUT = "artifacts/qa-upload";
const RUN = Date.now().toString(36).slice(-5);
const TITLE = `QA Upload ${RUN}`;

const log = (...a) => console.log(...a);
const pool = new Pool({ connectionString: DB, max: 2 });

async function main() {
  await mkdir(OUT, { recursive: true });
  const photoPath = `${OUT}/source.jpg`;
  await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: "#d7e8d9" },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="1600" height="1200"><rect width="1600" height="1200" fill="#d7e8d9"/><rect x="240" y="200" width="1120" height="800" rx="24" fill="#2f6f5e"/><text x="800" y="650" font-family="Arial" font-size="110" fill="#ffffff" text-anchor="middle">BOOKLOOP QA</text></svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 88 })
    .toFile(photoPath);

  const browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)));

  let listingId = null;
  try {
    log("signing in as seller1");
    const signIn = await ctx.request.post(`${BASE}/api/auth/sign-in/email`, {
      data: { email: "seller1@test.bookloop.local", password: "Bookloop!2345" },
    });
    if (!signIn.ok()) throw new Error(`sign-in failed: HTTP ${signIn.status()} ${await signIn.text()}`);
    log("  ✓ signed in");

    log("opening /sell and uploading a photo");
    await page.goto(`${BASE}/sell`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator('input[type="file"]').setInputFiles(photoPath);
    await page.locator('img[alt="Photo 1"]').waitFor({ timeout: 60000 });
    const thumb = await page.locator('img[alt="Photo 1"]').evaluate(async (img) => {
      if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
      return { src: img.currentSrc || img.src, w: img.naturalWidth, h: img.naturalHeight };
    });
    log(`  ✓ thumbnail ${decodeURIComponent(thumb.src)} (${thumb.w}x${thumb.h})`);
    if (!decodeURIComponent(thumb.src).includes("/api/photos/")) {
      throw new Error("thumbnail is not a local photo URL");
    }
    if (thumb.w === 0) throw new Error("thumbnail did not load");

    await page.locator("#title").fill(TITLE);
    await page.locator("#subject").fill("Science");
    await page.locator("#priceInr").fill("111");
    await page.getByText("Good", { exact: true }).click();

    await page.getByRole("button", { name: "Preview listing" }).click();
    await page.getByRole("img", { name: TITLE }).waitFor({ timeout: 20000 }).catch(() => {});
    await page.getByRole("button", { name: "Publish" }).click();
    await page.getByText("Your book is live!").waitFor({ timeout: 60000 });
    const bookloopId = (await page.getByText(/^BL-/).first().textContent())?.trim();
    log(`  ✓ published ${bookloopId}`);
    await page.screenshot({ path: `${OUT}/published-success.png`, fullPage: true });

    const { rows } = await pool.query(
      `select l.id, p.url from listings l join listing_photos p on p.listing_id = l.id
        where l.title = $1 order by p.sort_order limit 1`,
      [TITLE],
    );
    if (!rows[0]) throw new Error("published listing not found in the database");
    listingId = rows[0].id;
    const photoUrl = rows[0].url;
    log(`  ✓ db listing #${listingId} photo ${photoUrl}`);

    const res = await page.request.get(BASE + photoUrl);
    const type = res.headers()["content-type"];
    const body = await res.body();
    log(`  ✓ GET ${photoUrl} → ${res.status()} ${type} ${body.length} bytes`);
    if (res.status() !== 200 || type !== "image/webp" || body.length < 1000) {
      throw new Error("photo endpoint did not serve a WebP image");
    }

    await page.goto(`${BASE}/listings/${listingId}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: TITLE }).waitFor({ timeout: 30000 });
    const detailImg = page.getByAltText(`${TITLE} — photo 1`).first();
    await detailImg.waitFor({ timeout: 30000 });
    const detail = await detailImg.evaluate(async (img) => {
      if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
      return { w: img.naturalWidth, h: img.naturalHeight };
    });
    log(`  ✓ detail image rendered ${detail.w}x${detail.h}`);
    if (detail.w === 0) throw new Error("detail page image did not load");
    await page.screenshot({ path: `${OUT}/listing-detail.png`, fullPage: true });

    const report = { ok: true, title: TITLE, listingId, bookloopId, photoUrl, bytes: body.length, consoleErrors };
    await writeFile(`${OUT}/result.json`, JSON.stringify(report, null, 2));
    log("\nUPLOAD CHECK PASSED");
  } finally {
    await browser.close();
    if (listingId) {
      await pool
        .query(`delete from listing_photos where listing_id = $1`, [listingId])
        .catch(() => {});
      await pool.query(`delete from listings where id = $1`, [listingId]).catch(() => {});
    }
    await pool.query(`delete from photo_blobs where owner_id in (select id from users where email = $1)`, [
      "seller1@test.bookloop.local",
    ]).catch(() => {});
    await pool.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error("\nUPLOAD CHECK FAILED:", err.message);
  process.exit(1);
});
