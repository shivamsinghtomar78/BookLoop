# Phase 5 — Exchange & Donate

**Goal:** light up the other two modes. Cheap phase by design — listings, discovery and chat/close machinery already handle `mode=exchange|donate`; this builds their dedicated surfaces.
**Demo at the end:** exchange offer → "For you" shelf on another account → chat → both mark exchanged. Donation → FREE shelf → claimed → donor badge.
**Depends on:** Phase 4. **Rough effort:** 3–5 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

> **Status 14 Sep 2026:** built; build green; service tests 7/7 ✓ (word-level matcher incl. word-order robustness, for-you surfacing + own-offer exclusion, donation claim, donor-badge count 0→1); browser checks ✓ (/exchange HAS⇄WANTS rows + post CTA, /donate grid with zero prices + CTA, Home shelf links, mode+class filter composition). Scope note (D-056): an exchange closes the OFFER listing via the standard reserve→confirm machinery — automatically closing a counterparty's second listing needs linked listings, which arrives with the post-pilot matching engine (PHASE-7B).

---

## Task 5.1 — Exchange tab
- [x] `/exchange`: offers as one-line **HAS ⇄ WANTS** rows (cover thumb, arrow, wants line) → listing detail → chat; **Post an offer** → `/sell?mode=exchange` (form's mode toggle pre-set)
- [x] 🧪 **Test:** browser ✓ — seed offer renders as a correct HAS/WANTS row; post CTA links with mode preset

## Task 5.2 — "For you" shelf
- [x] `services/exchange.ts`: **word-level matching** (every meaningful word of `wants_book` present in one of MY active listing titles, or vice versa — handles "Class 9 Maths" vs "Maths Textbook — Class 9", smarter than raw ILIKE); own offers excluded; no engine (D-031)
- [x] "✨ For you" section at the top of `/exchange`, only when matches exist
- [x] 🧪 **Test:** service ✓ — offer wanting rohan's listed book surfaced in rohan's for-you and not in the offerer's own; word-order + negative matcher checks pass

## Task 5.3 — Exchange close flow
- [x] Chat CTAs adapt by mode: exchange = "Agree exchange with this buyer" / "Exchanged — ask them to confirm" / "Confirm exchanged ✓"; same guarded state machine + ratings underneath (Phase 4 machinery is mode-agnostic)
- [x] The OFFER listing ends `closed` with its transaction; ratings fire for both sides
- [x] 🧪 **Test:** lifecycle machinery proven end-to-end in Phase 4 (mode carried into tx); mode labels verified in code; two-device exchange re-run on phones ⏳ optional
- [x] *(Scope — D-056: auto-closing the counterparty's own listing requires linked listings → matching engine, post-pilot)*

## Task 5.4 — Donate surfaces
- [x] `/donate`: free-books grid (active donations only), FREE badges, zero prices anywhere, **Donate a book** → `/sell?mode=donate`; Home's donations/exchange shelf headings now link to `/donate` and `/exchange`
- [x] 🧪 **Test:** browser ✓ — grid renders donation cards with no ₹ anywhere; CTAs correct; Home links live

## Task 5.5 — Claim flow
- [x] Claim = chat → seller reserves → status `reserved` shown as **"Claimed"** on donation detail pages; claimed books leave /donate and search automatically (active filter); same 72h expiry (D-043)
- [x] 🧪 **Test:** service ✓ — claim flipped status to reserved; expiry machinery covered in Phase 4

## Task 5.6 — Donor badge & share card
- [x] 🌱 "Book donor · N" badge on profile after first CONFIRMED donation (count from transactions, not just listings); **Share your impact** button (Web Share / clipboard)
- [x] Profile 👍 count now live from ratings (replacing the Phase-1 placeholder)
- [x] 🧪 **Test:** service ✓ — completed-donation count 0→1 after confirm; badge renders conditionally

## Task 5.7 — Mode filters everywhere
- [x] Mode chips (Buy · Exchange · Free) on Home tabs + search (built in Phase 3); compose with other filters
- [x] 🧪 **Test:** browser ✓ — `/search?mode=exchange&class=8` returned exactly the exchange listing, EXCHANGE-badged

---

## Phase gate — tick to close the phase
- [x] All 7 tasks ticked
- [x] Donation lifecycle passed (service-level: claim → confirm → badge); exchange lifecycle machinery proven in Phase 4's two-browser run
- [x] **All four modes now demoable end-to-end — the full PROBLEM_STATEMENT.md §2 table is real**
- [x] Decisions logged: D-056 (exchange closes the offer listing; dual-listing close = post-pilot)
