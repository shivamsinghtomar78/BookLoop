# Phase 3 — Buy: Discovery

**Goal:** the demand side — find the right book in ≤2 taps, save it, or get notified when it appears.
**Demo at the end:** "Books for Class 9" shelf → filter → book page → wishlist; a matching listing published from another account triggers a notification.
**Depends on:** Phase 2 (real listings to search). **Rough effort:** 5–8 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

---

## Task 3.1 — Home: mode tabs + shelves (real data)
- [ ] **Mode tabs** under the search pill: All · Buy · Exchange · Free — one tap re-scopes every shelf (D-049; underline active state per UI_REFERENCE.md §6.5)
- [ ] Shelves with **linked headings + See-all**: "Books for your class" (profile class; generic for guests), "Recently listed", "Free — donations available", "Wanted for exchange" (data exists from Phase 2's mode toggle); cached RSC revalidated on publish (D-036)
- [ ] Book card per UI_REFERENCE.md §3/§6.3: max 5 elements, flat (no border/shadow), rounded-2xl photo, image zoom inside the clipped frame, one component reused everywhere
- [ ] 🧪 **Test:** publish a Class 7 book → appears on a Class 7 user's shelf and "Recently listed" without redeploy; each mode tab re-scopes all shelves correctly; every shelf heading navigates to its pre-filtered results; guest Home renders in <2s on throttled 3G

## Task 3.2 — Search & filter chips
- [ ] Search page: title `ILIKE` search + results grid
- [ ] **Filter chips** (removable, instant, no apply button): category, class, subject, exam (competitive only), condition, price slider + Free toggle — category-aware per D-003
- [ ] Default sort: user's class first; filters encoded in URL (shareable results)
- [ ] 🧪 **Test:** each chip narrows results correctly and removes with one tap; exam chip appears only when category=competitive; a filtered URL pasted in another browser reproduces the same results

## Task 3.3 — Book detail page
- [ ] Swipeable photo carousel; title, category, class/subject, edition; condition tier + note; price / FREE / EXCHANGE badge with "wants: ___"
- [ ] Seller card: name, class, 👍 count placeholder — **no phone/email anywhere** (D-004)
- [ ] BookLoop ID + QR; **sticky Chat-with-Seller bar** — solid primary green, the one floating-elevation element on the page (UI_REFERENCE.md §3), disabled with "coming in Phase 4" state; wishlist heart = layered white-outline pattern (§6.4)
- [ ] 🧪 **Test:** every listing mode renders its correct badge; page loads by BookLoop ID URL; the chat bar is the only green element on the page; grep the rendered HTML for the seller's email/phone → zero hits

## Task 3.4 — Wishlist
- [ ] Heart on cards + detail page: one tap, optimistic fill, toast ("Saved") (`wishlist_items`, unique per user+listing)
- [ ] Profile → My Wishlist: saved books with current status (active/reserved/closed)
- [ ] 🧪 **Test:** heart toggles instantly and survives refresh; guest tap → signup sheet → heart lands (re-verify Task 1.6 path); closed book shows its state in the wishlist

## Task 3.5 — Notify-me alerts
- [ ] Empty search results → "Notify me when it's listed" pre-filled from active filters → `book_alerts` row
- [ ] Profile: manage alerts (list, deactivate)
- [ ] 🧪 **Test:** search something nonexistent → create alert → row correct in DB with the filter criteria; deactivating stops future matches

## Task 3.6 — Alert matching on publish
- [ ] In `listings.create()`: match new listing against active `book_alerts` (keyword ILIKE title + category/class/subject equality) → INSERT `notifications` rows (synchronous — D-038)
- [ ] Resend email per match, **best-effort** (failure never blocks publish — ARCHITECTURE.md rule 6)
- [ ] 🧪 **Test:** account A sets alert "Class 9 Maths" → account B publishes a matching book → A has a notification row + email; kill the Resend key in a preview env → publish still succeeds, in-app notification still created

## Task 3.7 — Notifications UI
- [ ] Bell + unread badge in app shell (30s count poll — D-037); notification list screen; **deep links** (alert match → listing)
- [ ] Mark-as-read on open
- [ ] 🧪 **Test:** badge updates within 30s of a new notification; tapping navigates to the exact listing; reopening shows it read; background tab makes no badge polls (network tab)

## Task 3.8 — Empty states & dead-end pass (buy side)
- [ ] No results → alert CTA + relaxed-filter suggestion ("8 books in Class 9 — see all")
- [ ] Empty wishlist → trending books in the user's class
- [ ] 🧪 **Test:** force each empty state (absurd filters, fresh account) → the promised next action is present and works (WORKFLOW.md §9 rows 1, 5)

---

## Phase gate — tick to close the phase
- [ ] All 8 tasks fully ticked
- [ ] 👆 **Tap test on production:** app open → own-class books in ≤2 taps; a specific book via filters in ≤4 (counted by a team member who didn't build it)
- [ ] Cross-account alert→notification→email loop verified on production
- [ ] Decisions made this phase logged in `DECISIONS.md`
