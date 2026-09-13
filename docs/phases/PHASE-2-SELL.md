# Phase 2 — Sell: Listings Core

**Goal:** the full supply side — a student lists a book in under 2 minutes and gets a live listing with BookLoop ID + QR.
**Demo at the end:** snap photos of a real book → publish → `BL-0042` + QR live → share card opens WhatsApp.
**Depends on:** Phase 1 (confirmed users only). **Rough effort:** 5–8 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

> **Status 13 Sep 2026:** built; build green; service layer headless-tested against dev DB (create + atomic photos ✓, foreign-edit rejected ✓, owner edit ✓, 21st listing refused ✓, soft delete ✓, cleanup ✓); pages smoke-tested (guest /sell 307, detail 200 with BookLoop ID, garbage id 404, /api/uploadthing mounted). **Photo upload untestable until `UPLOADTHING_TOKEN` is set** — get one free at uploadthing.com and add to `.env`. Browser checks marked ⏳.

---

## Task 2.1 — Photo upload (UploadThing)
- [x] File router `bookPhotos` (`api/uploadthing/core.ts`): images only, 4MB, max 4 files; middleware requires signed-in + email-confirmed user; client → UploadThing direct (ARCHITECTURE.md rule 5)
- [x] `PhotoUploader` component: camera/gallery picker, upload progress state, thumbnails with remove, COVER tag on first photo; `*.ufs.sh`/`utfs.io` allowed in next/image
- [ ] 🧪 **Test:** upload from a phone camera + gallery; 5th file and a PDF rejected; network tab shows uploads going to UploadThing, not our domain ⏳ **blocked on `UPLOADTHING_TOKEN`**

## Task 2.2 — Sell form UI
- [x] Photo-first single screen (D-042): photos → title → category chips → **conditional fields** (textbook/reference: class+subject · competitive: exam+subject · novel: genre/author) → edition/year → condition as **4 emoji-cards with hints** → note → **Sell/Exchange/Donate toggle** (price ⟷ wants-book ⟷ donate note)
- [ ] 🧪 **Test:** switching category swaps fields with no leftover values; switching mode swaps price/wants/neither ⏳ manual (values are cleared server-side by `toRow` regardless — a stale client field can never reach the DB)

## Task 2.3 — Validation (one schema, two gates)
- [x] `listingSchema` in `lib/zod-schemas.ts` with `superRefine` per category/mode (class+subject for textbook/reference, exam for competitive, price ₹1–9999 for sell, wants-book for exchange, 1–4 photo URLs)
- [x] Same schema: react-hook-form client-side + re-parsed in `publishListingAction`/`updateListingAction` (D-036)
- [ ] 🧪 **Test:** per-combo bad payloads direct to the action rejected server-side ⏳ manual spot-check (the action provably parses the same schema before any DB call)

## Task 2.4 — Smart defaults & price nudge
- [x] Class pre-filled from seller profile (`sellerClass` → form default); editable
- [x] Price nudge under the price field from `PRICE_HINTS` per category ("Books like this usually go for ₹80–250")
- [ ] 🧪 **Test:** Class 9 user's form opens with class=9; nudge updates with category ⏳ manual

## Task 2.5 — Listings service (create)
- [x] `services/listings.ts` `createListing()`: id reserved via sequence → listing + photos in ONE atomic `db.batch` (neon-http has no interactive transactions — batch is the atomic unit); `bookloop_id` = `BL-` + zero-padded id
- [x] Auth + confirmed-email enforced in the action (`requireUser({confirmedEmail:true})`); typed `DomainError` → friendly messages
- [x] Rate limit: max 20 active listings per user via DB count (D-039)
- [x] 🧪 **Test:** headless ✓ — create returned `BL-0024` with 2 photo rows atomically; 21st active listing refused with clear message; unconfirmed/guest path returns error not crash

## Task 2.6 — Preview, publish, success
- [x] Preview step renders the buyer view from form state → Publish; `revalidatePath("/")` on publish (D-036)
- [x] Success screen: 🎉 + BookLoop ID + QR (`qrcode` → data URL of the listing URL) + **Share** (Web Share API, clipboard fallback) + View listing link
- [ ] 🧪 **Test:** publish on a phone → QR scans to the listing URL; Share opens WhatsApp; listing on Home immediately ⏳ manual (needs UploadThing token first)

## Task 2.7 — My Listings (manage)
- [x] Profile → My Listings: real rows (cover thumbnail, BookLoop ID, price/mode, status), Active+Reserved then Closed; edit → `/sell?edit=<id>` (same form, pre-filled via `getOwnedListingForEdit`); delete with confirm dialog → status `deleted`
- [x] Ownership enforced in the service — edit/delete of someone else's listing throws `DomainError`
- [x] 🧪 **Test:** headless ✓ — foreign edit rejected, owner edit persisted (price 99→111), delete soft-deleted (row kept, gone from browse via status filter)
- [x] Minimal `/listings/[id]` detail page (photos strip, fields, badges, seller name — full version is Phase 3 Task 3.3); 404 for missing/deleted ✓

## Task 2.8 — Offline draft
- [x] Form state autosaved to localStorage on change (new listings only); "Draft resumed" banner on return; draft cleared on publish; all storage calls wrapped in try/catch
- [ ] 🧪 **Test:** fill half the form → kill the tab → reopen → values intact; after publish, no resume ⏳ manual

---

## Phase gate — tick to close the phase
- [ ] All 8 tasks fully ticked (needs `UPLOADTHING_TOKEN` + manual ⏳ checks)
- [ ] ⏱️ **Stopwatch test on production:** a team member who didn't build the form lists a real book on a phone in **under 2 minutes**
- [x] DB spot-check: photos are URLs only; every listing has a unique `BL-…` id (unique constraint proven in Phase 0, exercised again here)
- [x] Decisions made this phase logged in `DECISIONS.md` (none new — D-042 executed as designed)
