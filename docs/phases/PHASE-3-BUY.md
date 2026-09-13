# Phase 3 — Buy: Discovery

**Goal:** the demand side — find the right book in ≤2 taps, save it, or get notified when it appears.
**Demo at the end:** "Books for Class 9" shelf → filter → book page → wishlist; a matching listing published from another account triggers a notification.
**Depends on:** Phase 2 (real listings to search). **Rough effort:** 5–8 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

> **Status 13 Sep 2026:** built; build green; service layer headless-tested (alert match on publish notified the right user ✓, no self-notification ✓, wishlist toggle on→off ✓, own-listing wishlist rejected ✓); browser-tested via Playwright (mode tabs re-scope shelves, Free tab shows no prices, `/search?class=8` returns only Class 8 with active chip, empty search shows alert CTA, guest alert tap opens auth sheet, detail page has seller card + disabled chat bar + heart). One real bug found & fixed by the browser tests: bare `0` in ORDER BY (Postgres positional reference) 500'd guest searches. Manual ⏳ checks below.

---

## Task 3.1 — Home: mode tabs + shelves (real data)
- [x] Mode tabs All · Buy · Exchange · Free under the header — one tap re-scopes the page via `/?mode=` (D-049/D-050); underline active state, no layout shift
- [x] Shelves with linked headings + See-all: "Books for Class N" (profile-aware, logged-in only), "Recently listed", "Free — donations available", "Wanted for exchange" — hybrid layout (shelves < md, 3→6-col grids md+, D-054)
- [x] Book card per UI_REFERENCE §3/§6.3 (flat, zoom-in-frame, 5 elements) + wishlist heart overlay
- [x] 🧪 **Test:** browser ✓ — All tab shows 3 shelves w/ 3 See-all links (class shelf appears when logged in); Free tab shows only donations, zero prices, FREE badges; *(publish→shelf-refresh verified in Phase 2; class-shelf-for-logged-in re-verify on a phone ⏳)*

## Task 3.2 — Search & filter chips
- [x] Title `ILIKE` search (debounced input writing `q` to the URL) + results grid
- [x] **Filter chips**, removable, no apply button: mode, category, exam (only when category=competitive), class, condition, price presets (Under ₹100 / ₹100–200 / ₹200+ — slider deferred to polish); state entirely in the URL (shareable)
- [x] Default sort: viewer's class first (CASE expression), newest next — skipped cleanly for guests
- [x] 🧪 **Test:** browser ✓ — `/search?class=8` → only Class 8 results, chip rendered active from URL alone; found+fixed the guest-sort 500

## Task 3.3 — Book detail page
- [x] Photo gallery (swipe strip < lg, stacked lg+, first photo priority-loaded), condition + note, price / FREE / EXCHANGE badges, BookLoop ID
- [x] **Seller card**: name, class, active-listings count, 👍 count (live from ratings — 0 until Phase 4); **no phone/email anywhere** (D-004)
- [x] **Sticky Chat-with-Seller bar** — the one green action, fixed above the tab bar on mobile / inline on lg; disabled "coming in Phase 4"; hidden on own listings; reserved listings show "see similar" instead
- [x] Wishlist heart on the cover photo (hidden on own listings)
- [x] 🧪 **Test:** browser ✓ — seller card + disabled chat bar + heart all present; no seller email in the rendered page

## Task 3.4 — Wishlist
- [x] Layered white-outline heart (UI_REFERENCE §6.4) on cards + detail; optimistic toggle with rollback + toast; unique per (user, listing); own listings rejected in the service
- [x] Profile → My Wishlist: saved books with live status (active/reserved/closed)
- [x] 🧪 **Test:** service ✓ (toggle on→off, own-listing rejected); guest heart tap → auth sheet ✓; in-browser signed-in toggle + refresh persistence ⏳ manual

## Task 3.5 — Notify-me alerts
- [x] Empty search → "Notify me when it's listed" pre-filled from active filters (guests get the auth sheet first); max 10 active alerts per user
- [x] Profile → My Alerts: labeled rows ("Chemistry · Competitive exam"), one-tap deactivate
- [x] 🧪 **Test:** browser ✓ — empty state shows CTA; guest tap opens auth sheet; alert row creation verified at service level

## Task 3.6 — Alert matching on publish
- [x] In `createListing`: synchronous match (D-038) — keyword ILIKE title + category/class/subject equality, seller excluded, deduped per user → `notifications` rows; matching failures can never fail the publish
- [x] Resend email per match, best-effort (ARCHITECTURE rule 6) via shared `lib/email.ts`
- [x] 🧪 **Test:** service ✓ — matching listing published → watcher's unread count +1 and email rendered (dev fallback); seller's own alert NOT triggered; real-inbox test ⏳ once `RESEND_API_KEY` set

## Task 3.7 — Notifications UI
- [x] Bell + unread badge in the header (30s poll of `/api/notifications`, paused when tab hidden — D-037); hidden for guests
- [x] `/notifications`: list with unread highlighting, deep links to listings, marks all read on open
- [x] 🧪 **Test:** endpoint + page render verified; cross-account badge-within-30s check ⏳ manual (two browsers)

## Task 3.8 — Empty states & dead-end pass (buy side)
- [x] No results → alert CTA + relaxed suggestion ("N books in Class X — see all", logged-in only)
- [x] Empty wishlist → "New in Class N" trending shelf on profile
- [x] 🧪 **Test:** browser ✓ — empty search renders CTA (relaxed line needs a logged-in user ⏳); empty-wishlist trending renders for fresh accounts ⏳ manual

---

## Phase gate — tick to close the phase
- [ ] All 8 tasks fully ticked (manual ⏳ checks done)
- [ ] 👆 **Tap test on production:** app open → own-class books in ≤2 taps; a specific book via filters in ≤4 (counted by a team member who didn't build it) ⏳ needs Vercel
- [ ] Cross-account alert→notification→email loop verified on production
- [x] Decisions made this phase logged in `DECISIONS.md` (none new — D-037/038/049/050 executed as designed; price slider consciously shipped as presets, revisit in Phase 6 polish)
