// Two-account end-to-end run of the negotiation → reservation → handover flow
// against the running Docker stack. Drives the real UI with Playwright, checks
// Postgres state after every reservation, and captures the exchange flow.

import { chromium } from "playwright-core";
import { Pool } from "pg";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { assertTestDb } from "./lib/test-db.mjs";
import { resolveChromiumExecutable } from "./lib/browser.mjs";
import { cleanupE2eData } from "./e2e-cleanup.mjs";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const PASSWORD = "Bookloop!2345";
const RUN = Date.now().toString(36).slice(-4).toLowerCase();
const SELLER = { name: "Tara E2E", email: `e2e-seller-${RUN}@example.com` };
const BUYER = { name: "Ishaan E2E", email: `e2e-buyer-${RUN}@example.com` };
const SHOTS = "artifacts/legacy-e2e";
const CHROME = resolveChromiumExecutable();

if (!CHROME) {
  console.error("No Chromium build found. Run: npx playwright-core install chromium");
  process.exit(1);
}

let pool = null;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function poll(fn, { timeout = 30000, interval = 350, label = "condition" } = {}) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (err) {
      last = err;
    }
    await wait(interval);
  }
  throw new Error(`Timed out waiting for ${label}${last ? `: ${last.message}` : ""}`);
}

async function dbState(listingId) {
  const { rows } = await pool.query(
    `select l.status, t.id as tx_id, t.buyer_confirmed_at, t.seller_id, t.buyer_id
       from listings l left join transactions t on t.listing_id = l.id
      where l.id = $1`,
    [listingId],
  );
  return rows[0] ?? null;
}

// Remove accounts and data left by earlier harness runs (email prefix e2e-).
async function cleanupPreviousRuns() {
  const result = await cleanupE2eData(pool, { emailLike: "e2e-%@example.com" });
  return result.users;
}

async function signup(page, user, klass, age) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Sign up", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  await dialog.getByLabel("Full name").fill(user.name);
  await dialog.getByLabel("School name").fill("Pilot School");
  await dialog.getByLabel("Age").fill(String(age));
  await dialog.getByLabel("Class").selectOption(String(klass));
  await dialog.getByLabel("Email").fill(user.email);
  await dialog.getByLabel("Password").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Sign up", exact: true }).click();
  await poll(
    async () => !(await dialog.isVisible()),
    { label: `signup sheet to close for ${user.email}`, timeout: 45000 },
  );
  await page.getByRole("link", { name: "Profile" }).waitFor({ timeout: 40000 });
  log(`  ✓ account ${user.email}`);
}

async function openChat(buyerPage, listingId) {
  await buyerPage.goto(`${BASE}/listings/${listingId}`, { waitUntil: "domcontentloaded" });
  // Authed links only render once the client session has hydrated; clicking
  // earlier would open the auth sheet instead of starting the chat.
  await buyerPage.getByRole("link", { name: "Profile" }).waitFor({ timeout: 30000 });
  await buyerPage.getByRole("button", { name: /Chat with Seller/ }).click();
  const outcome = await poll(
    async () => {
      if (await buyerPage.getByRole("textbox", { name: "Message" }).isVisible().catch(() => false)) return { ok: true };
      if (/\/chats\/\d+/.test(buyerPage.url())) return { ok: true };
      if (await buyerPage.getByRole("dialog").isVisible().catch(() => false))
        return { ok: false, reason: "auth sheet opened instead of chat" };
      const toast = await buyerPage
        .locator("[data-sonner-toast]")
        .first()
        .textContent()
        .catch(() => null);
      return toast ? { ok: false, reason: toast.trim() } : null;
    },
    { timeout: 45000, interval: 300, label: "chat to open" },
  ).catch(async (err) => {
    await buyerPage.screenshot({ path: `${SHOTS}/e2e-failure.png` });
    throw err;
  });
  if (!outcome.ok) {
    await buyerPage.screenshot({ path: `${SHOTS}/e2e-failure.png` });
    throw new Error(`could not open chat: ${outcome.reason}`);
  }
  const id = await poll(
    () => buyerPage.url().match(/\/chats\/(\d+)/)?.[1],
    { timeout: 15000, label: "chat url" },
  );
  return Number(id);
}

async function createListings(sellerId, scenarios) {
  const ids = [];
  for (const [i, s] of scenarios.entries()) {
    const bookloopId = `E2E${RUN}${String(i + 1).padStart(2, "0")}`.slice(0, 10);
    const { rows } = await pool.query(
      `insert into listings
         (bookloop_id, seller_id, title, category, mode, class, subject, exam, genre,
          condition, price_inr, wants_book, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'active')
       returning id`,
      [
        bookloopId,
        sellerId,
        s.title,
        s.category,
        s.mode,
        s.klass ?? null,
        s.subject ?? null,
        s.exam ?? null,
        s.genre ?? null,
        s.condition ?? "good",
        s.mode === "sell" ? s.price : null,
        s.wants ?? null,
      ],
    );
    const id = rows[0].id;
    await pool.query(
      `insert into listing_photos (listing_id, url, sort_order) values ($1,$2,1), ($1,$3,2)`,
      [id, s.photo, s.photo2 ?? s.photo],
    );
    ids.push(id);
  }
  return ids;
}

async function send(page, text) {
  const box = page.getByLabel("Message", { exact: true });
  await box.waitFor({ state: "visible", timeout: 30000 });
  await wait(1100); // minSecondsBetweenMessages
  await box.fill(text);
  await box.press("Enter");
  await page.getByText(text, { exact: true }).first().waitFor({ timeout: 30000 });
}

async function sellerOpenChat(sellerPage, title) {
  await sellerPage.goto(`${BASE}/chats`, { waitUntil: "domcontentloaded" });
  const link = sellerPage.getByRole("link").filter({ hasText: title }).first();
  await link.waitFor({ timeout: 30000 });
  await link.click();
  await sellerPage.waitForURL(/\/chats\/\d+/, { timeout: 20000 });
}

async function runScenario({ n, scenario, listingId, buyerPage, sellerPage, guestPage, results, shots }) {
  const label = `#${String(n).padStart(2, "0")} ${scenario.mode} · ${scenario.title}`;
  log(`\n${label}`);
  const started = Date.now();

  await openChat(buyerPage, listingId);
  for (const message of scenario.buyerMessages) await send(buyerPage, message);

  await sellerOpenChat(sellerPage, scenario.title);
  await poll(
    () => sellerPage.getByText(scenario.buyerMessages.at(-1), { exact: true }).isVisible(),
    { label: "buyer message to reach seller" },
  );
  for (const message of scenario.sellerMessages) await send(sellerPage, message);

  const reserveLabel = {
    sell: "Reserve for this buyer",
    exchange: "Agree exchange with this buyer",
    donate: "Reserve for this student",
  }[scenario.mode];
  await sellerPage.getByRole("button", { name: reserveLabel }).click();
  await sellerPage.getByRole("button", { name: "Cancel", exact: true }).waitFor({ timeout: 45000 });

  // Reservation must be visible in Postgres and to a signed-out visitor.
  await poll(
    async () => {
      const st = await dbState(listingId);
      return st?.status === "reserved" && st.tx_id ? st : null;
    },
    { label: "db status reserved" },
  );
  await guestPage.goto(`${BASE}/listings/${listingId}`, { waitUntil: "domcontentloaded" });
  const publicBadge = scenario.mode === "donate" ? "Claimed" : "Reserved";
  await poll(() => guestPage.getByText(publicBadge, { exact: true }).first().isVisible(), {
    label: `public ${publicBadge} badge`,
  });

  if (scenario.cancelFirst) {
    await sellerPage.getByRole("button", { name: "Cancel", exact: true }).click();
    await sellerPage.getByRole("button", { name: reserveLabel }).waitFor({ timeout: 45000 });
    const back = await poll(
      async () => {
        const st = await dbState(listingId);
        return st?.status === "active" && !st.tx_id ? st : null;
      },
      { label: "reservation cancelled → active" },
    );
    if (!back) throw new Error("cancel did not release the listing");
    await guestPage.reload({ waitUntil: "domcontentloaded" });
    const stillReserved = await guestPage.getByText(publicBadge, { exact: true }).count();
    if (stillReserved) throw new Error("public badge still shows reserved after cancel");
    // reserve again, this time for keeps
    await sellerPage.getByRole("button", { name: reserveLabel }).click();
    await sellerPage.getByRole("button", { name: "Cancel", exact: true }).waitFor({ timeout: 20000 });
    await poll(async () => (await dbState(listingId))?.status === "reserved", {
      label: "re-reserve after cancel",
    });
  }

  if (scenario.capture) {
    await sellerPage.screenshot({ path: `${SHOTS}/${scenario.capture}-seller-reserved.png` });
    await guestPage.screenshot({ path: `${SHOTS}/${scenario.capture}-public-reserved.png` });
  }

  const confirmLabel = scenario.mode === "exchange" ? "Confirm exchanged ✓" : "Confirm received ✓";
  await buyerPage.reload({ waitUntil: "domcontentloaded" });
  await buyerPage.getByRole("button", { name: confirmLabel }).click({ timeout: 45000 });
  await poll(
    () =>
      buyerPage
        .getByText(/How did it go\?|Done ✓/)
        .first()
        .isVisible(),
    { label: "buyer confirmation" },
  );
  const done = await poll(
    async () => {
      const st = await dbState(listingId);
      return st?.status === "closed" && st.buyer_confirmed_at ? st : null;
    },
    { label: "db status closed" },
  );

  if (scenario.capture) {
    await buyerPage.screenshot({ path: `${SHOTS}/${scenario.capture}-buyer-done.png` });
    shots.push(`${scenario.capture}-seller-reserved.png`, `${scenario.capture}-public-reserved.png`, `${scenario.capture}-buyer-done.png`);
  }
  // Rate the exchange (last step of the stepper)
  const thumb = buyerPage.getByRole("button", { name: "Thumbs up" });
  if (await thumb.isVisible().catch(() => false)) await thumb.click().catch(() => {});

  results.push({
    n,
    mode: scenario.mode,
    title: scenario.title,
    listingId,
    txId: done.tx_id,
    reservedPublicly: true,
    closed: true,
    cancelTested: !!scenario.cancelFirst,
    ms: Date.now() - started,
  });
  log(`  ✓ reserved → confirmed (tx #${done.tx_id}) in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const scenarios = [
    { mode: "sell", category: "textbook", klass: 9, subject: "Science", price: 120, title: "Science Textbook — Class 9", photo: "/images/books/textbook-stack.webp", buyerMessages: ["Hi! Is this still available?", "Would ₹100 work?"], sellerMessages: ["Yes, it's available.", "₹100 works — I'll reserve it for you 🙂"] },
    { mode: "sell", category: "textbook", klass: 9, subject: "Maths", price: 150, title: "Maths Textbook — Class 9", photo: "/images/books/notes-workbook.webp", buyerMessages: ["Hello, is the Maths book in good shape?", "Could you do ₹130?"], sellerMessages: ["Only light use — no torn pages.", "₹130 is fine."] },
    { mode: "sell", category: "textbook", klass: 8, subject: "English", price: 60, title: "English Reader — Class 8", photo: "/images/books/open-book-stack.webp", buyerMessages: ["₹50 for the English reader?"], sellerMessages: ["Deal — ₹50 it is."] },
    { mode: "sell", category: "reference", klass: 10, subject: "Maths", price: 180, title: "Maths Practice Guide — Class 10", photo: "/images/books/reference-desk.webp", buyerMessages: ["Does the guide have solved papers?", "I can pick it up after school."], sellerMessages: ["Yes, solved papers for both terms.", "Perfect, reserving it for you."] },
    { mode: "sell", category: "competitive", exam: "JEE", subject: "Physics", price: 250, title: "Physics Problem Book (JEE basics)", photo: "/images/books/study-stack.webp", buyerMessages: ["How many chapters are solved?", "Would ₹220 be okay?"], sellerMessages: ["12 chapters, all worked examples.", "₹220 — agreed."] },
    { mode: "sell", category: "novel", genre: "Adventure", price: 90, title: "Adventure Novel (English)", photo: "/images/books/novel-grass.webp", buyerMessages: ["Is this the R. Sharma edition?", "₹75?"], sellerMessages: ["Yes, same edition.", "₹75 works."] },
    { mode: "sell", category: "competitive", exam: "Olympiad", subject: "Maths", price: 200, title: "Olympiad Maths Workbook", photo: "/images/books/study-stack.webp", buyerMessages: ["Do you have the answer key?", "I'll take it for ₹170."], sellerMessages: ["Answer key is included.", "₹170 — locking it in."] },
    { mode: "exchange", category: "textbook", klass: 8, subject: "Science", title: "Science Textbook — Class 8", wants: "Class 8 Maths", photo: "/images/books/books-in-hand.webp", capture: "e2e-exchange", buyerMessages: ["Hi! I have a Class 8 Maths book — swap for your Science book?"], sellerMessages: ["Perfect, I need Maths for my sister. Let's swap!"] },
    { mode: "donate", category: "textbook", klass: 9, subject: "Hindi", title: "Hindi Textbook — Class 9", photo: "/images/books/milk-and-honey.webp", buyerMessages: ["Is the Hindi textbook free to claim?", "I can collect it at the school library."], sellerMessages: ["Yes, happy to pass it on.", "Great — reserving it for you."] },
    { mode: "sell", category: "reference", klass: 8, subject: "Science", price: 40, title: "Science Question Bank — Class 8", photo: "/images/books/open-book-stack.webp", buyerMessages: ["₹30 for the question bank?"], sellerMessages: ["Sure, ₹30."], cancelFirst: true },
  ];

  log("Starting two-account negotiation run");
  const cfg = await assertTestDb({ quiet: true, connect: false });
  pool = new Pool({ connectionString: cfg.unpooled, max: 2 });
  const cleaned = await cleanupPreviousRuns();
  if (cleaned) log(`  · removed ${cleaned} account(s) left by earlier runs`);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const sellerCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const buyerCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const guestCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const sellerPage = await sellerCtx.newPage();
  const buyerPage = await buyerCtx.newPage();
  const guestPage = await guestCtx.newPage();

  try {
    log("\nAccounts");
    await signup(sellerPage, SELLER, 9, 14);
    await signup(buyerPage, BUYER, 8, 13);
    const { rows } = await pool.query("select id from users where email = $1", [SELLER.email]);
    if (!rows[0]) throw new Error("seller profile was not created");
    const ids = await createListings(rows[0].id, scenarios);
    log(`  ✓ ${ids.length} listings seeded for seller ${SELLER.email}`);

    const results = [];
    const shots = [];
    for (const [i, scenario] of scenarios.entries()) {
      await runScenario({
        n: i + 1,
        scenario,
        listingId: ids[i],
        buyerPage,
        sellerPage,
        guestPage,
        results,
        shots,
      });
    }

    const report = results
      .map(
        (r) =>
          `| ${r.n} | ${r.mode} | ${r.title} | #${r.txId} | ${r.reservedPublicly ? "yes" : "no"} | ${r.closed ? "yes" : "no"} | ${r.cancelTested ? "yes" : "—"} | ${(r.ms / 1000).toFixed(1)}s |`,
      )
      .join("\n");
    const md = `# Negotiation E2E — ${new Date().toISOString()}\n\nBase: ${BASE}\nSeller: ${SELLER.email}\nBuyer: ${BUYER.email}\n\n| # | Mode | Listing | Tx | Reserved publicly | Closed | Cancel tested | Time |\n|---|---|---|---|---|---|---|---|\n${report}\n`;
    await writeFile(`${SHOTS}/e2e-report.md`, md);

    // Compose the exchange flow as a vertical three-panel story.
    try {
      const rows = [
        { file: shots[0], caption: "1 · Chat & agree — both sides agree on the swap" },
        { file: shots[1], caption: "2 · Reserved — anyone opening the listing sees it is held" },
        { file: shots[2], caption: "3 · Handover confirmed — buyer confirms, deal closed" },
      ];
      const W = 900;
      const GAP = 26;
      const CAP = 44;
      const panels = await Promise.all(
        rows.map((r) => sharp(`${SHOTS}/${r.file}`).resize({ width: W }).toBuffer()),
      );
      const metas = await Promise.all(panels.map((p) => sharp(p).metadata()));
      const height = metas.reduce((s, m) => s + m.height + CAP + GAP, 0) + GAP;
      const labels = [];
      const composites = [];
      let y = GAP;
      for (let i = 0; i < rows.length; i++) {
        labels.push(
          `<text x="${GAP}" y="${y + 26}" font-family="Inter, Arial" font-size="19" font-weight="600" fill="#07231c">${rows[i].caption.replace(/&/g, "&amp;")}</text>`,
        );
        y += CAP;
        composites.push({ input: panels[i], left: GAP, top: y });
        y += metas[i].height + GAP;
      }
      await sharp({
        create: { width: W + GAP * 2, height, channels: 3, background: "#faf9f5" },
      })
        .composite([
          ...composites,
          {
            input: Buffer.from(
              `<svg width="${W + GAP * 2}" height="${height}">${labels.join("")}</svg>`,
            ),
            left: 0,
            top: 0,
          },
        ])
        .png()
        .toFile(`${SHOTS}/e2e-exchange-flow.png`);
      log(`Exchange flow image: ${SHOTS}/e2e-exchange-flow.png`);
    } catch (err) {
      log(`  ! could not compose the flow image: ${err.message}`);
    }

    log(`\nAll ${results.length} negotiation scenarios passed. Report: ${SHOTS}/e2e-report.md`);
  } finally {
    await browser.close().catch(() => {});
    if (pool) {
      await cleanupE2eData(pool, { emailLike: "e2e-%@example.com" })
        .then((r) => log(`  · cleaned up ${r.users} account(s) and ${r.listings} listing(s)`))
        .catch((err) => log(`  ! cleanup failed: ${err.message}`));
      await pool.end().catch(() => {});
    }
  }
}

main().catch(async (err) => {
  console.error("\nE2E FAILED:", err);
  await pool?.end().catch(() => {});
  process.exit(1);
});
