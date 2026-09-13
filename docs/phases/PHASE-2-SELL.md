# Phase 2 — Sell: Listings Core

**Goal:** the full supply side — a student lists a book in under 2 minutes and gets a live listing with BookLoop ID + QR.
**Demo at the end:** snap photos of a real book → publish → `BL-0042` + QR live → share card opens WhatsApp.
**Depends on:** Phase 1 (confirmed users only). **Rough effort:** 5–8 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

---

## Task 2.1 — Photo upload (UploadThing)
- [ ] UploadThing wired: client → UploadThing **direct** (never through our functions — ARCHITECTURE.md rule 5)
- [ ] Config: images only, max 4 files, 4MB each; upload progress UI; remove/reorder thumbnails
- [ ] 🧪 **Test:** upload from a phone camera + gallery; 5th file and a PDF are rejected; network tab confirms upload requests go to UploadThing, not our domain

## Task 2.2 — Sell form UI
- [ ] Photo-first: camera/gallery picker is the first thing on screen (D-042)
- [ ] Fields: title → category picker → **conditional fields** (textbook/reference: class+subject · competitive: exam+subject · novel: genre/author) → edition/year
- [ ] Condition = **4 picture cards** (Like New / Good / Fair / Worn) with example photo + one-liner; optional note
- [ ] **Sell / Exchange / Donate toggle**: price ⟷ "which book do you want?" ⟷ neither
- [ ] 🧪 **Test:** switching category swaps the field set with no leftover values; switching mode swaps price/wants/neither; nothing irrelevant ever visible

## Task 2.3 — Validation (one schema, two gates)
- [ ] Category-conditional Zod schema in `lib/zod-schemas.ts` (textbook requires class+subject, competitive requires exam, sell requires price 1–9999, exchange requires wants_book…)
- [ ] Same schema: react-hook-form client-side + re-parsed in the server action (D-036)
- [ ] 🧪 **Test:** for each category/mode combo, submit a missing-required-field payload **directly to the action** (bypassing the form) → all rejected server-side with friendly errors

## Task 2.4 — Smart defaults & price nudge
- [ ] Class pre-filled from seller's profile (editable)
- [ ] Price nudge under the price field: "Class 9 Science books usually go for ₹80–150" — hardcoded ranges per class/category in `lib/constants.ts` for now (real data post-pilot)
- [ ] 🧪 **Test:** a Class 9 user's form opens with class=9; nudge text matches the chosen class+category and updates when they change

## Task 2.5 — Listings service (create)
- [ ] `services/listings.ts` `create()`: INSERT listing + photos in **one transaction**; generate `bookloop_id` = `BL-` + zero-padded id (DATABASE_SCHEMA.md §3)
- [ ] Auth + confirmed-email checks in the service; returns typed `{ok}|{error}` (ARCHITECTURE.md §3.2)
- [ ] Rate limit: max 20 active listings per user via DB count (D-039)
- [ ] 🧪 **Test:** created listing + photos appear atomically (kill the request mid-way in a test → no orphan photos); 21st active listing rejected with a clear message; unconfirmed user rejected

## Task 2.6 — Preview, publish, success
- [ ] Preview step renders the listing exactly as the buyer card + detail page will (reuses the same components)
- [ ] Success screen: "Live!" + BookLoop ID + QR (`qrcode` npm) + **Share button** (Web Share API → card with photo, title, price, link)
- [ ] `revalidatePath` on publish so Home/browse show it immediately (D-036)
- [ ] 🧪 **Test:** publish on a phone → QR scans (another phone's camera) to the listing URL; Share opens WhatsApp with the card; listing visible on Home within one refresh

## Task 2.7 — My Listings (manage)
- [ ] Profile → My Listings: Active / Closed tabs; edit (same form, pre-filled) and delete (status → `deleted`, confirm dialog)
- [ ] Ownership enforced in the service — only the seller can edit/delete (authz in services, never only UI)
- [ ] 🧪 **Test:** edit + delete work for the owner; calling edit/delete actions with another user's listing id → rejected server-side; deleted listing gone from browse but row kept in DB

## Task 2.8 — Offline draft
- [ ] Form state auto-saved to localStorage on change; "Resume listing" prompt on return (WORKFLOW.md §9)
- [ ] Draft cleared on successful publish
- [ ] 🧪 **Test:** fill half the form → kill the tab → reopen → resume with values intact (photos re-pick if missing); after publishing, no resume prompt

---

## Phase gate — tick to close the phase
- [ ] All 8 tasks fully ticked
- [ ] ⏱️ **Stopwatch test on production:** a team member who didn't build the form lists a real book on a phone in **under 2 minutes**
- [ ] DB spot-check: photos are URLs only; every listing has a unique `BL-…` id
- [ ] Decisions made this phase logged in `DECISIONS.md`
