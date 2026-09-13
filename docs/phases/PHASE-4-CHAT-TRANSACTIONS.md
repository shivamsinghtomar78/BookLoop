# Phase 4 — Chat & Transactions

**Goal:** the trust core — chat, reserve, hand over at school, confirm, rate. The hardest phase.
**Demo at the end:** two phones, full lifecycle: chat → reserve → mark sold → confirm → both rate → listing closed, 👍 on seller's profile.
**Depends on:** Phase 3. **Rough effort:** 6–9 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

---

## Task 4.1 — Chat creation & access control
- [ ] `services/chat.ts`: Chat-with-Seller creates/reuses the `chats` row (unique per listing+buyer); seller can't chat with themselves
- [ ] Access restricted to the two participants — enforced in the service on every read/write
- [ ] Rate limit: 10 new chats/day per user (DB count — D-039)
- [ ] 🧪 **Test:** third account requesting the chat's messages via direct API call → rejected; 11th new chat today → friendly limit message; tapping Chat twice → same chat, not a duplicate

## Task 4.2 — Message polling (the cost-critical task)
- [ ] `GET /api/chats/[id]/messages?after=<lastId>` → only newer rows (uses the `(chat_id, created_at)` index)
- [ ] Client: poll 4s while chat visible → 15s after ~2min idle → **stopped** when tab hidden (Page Visibility API) (D-037)
- [ ] Send message: optimistic append + rollback on failure; 1 msg/sec limit server-side
- [ ] 🧪 **Test:** two devices converse — messages land ≤4s; hide the tab → network tab shows **zero** polls; rapid-fire sending gets throttled server-side; `?after` returns only new rows (verify payload)

## Task 4.3 — Chat screen UX
- [ ] Message list + input; **quick-ask chips** on first open: "Is this available?" · "Can we meet tomorrow?" · "Will you take ₹__?" (D-044)
- [ ] Pinned card: **school pickup point** + "suggest a time" quick action (D-005)
- [ ] Listing summary header (photo, title, price) → taps back to the listing
- [ ] 🧪 **Test:** chips send with one tap and disappear after first message; pinned card always visible on scroll; header navigates correctly

## Task 4.4 — Status stepper
- [ ] Stepper at top of chat, identical both sides: **Chatting → Reserved → Meet at pickup → Done → Rate** (D-044)
- [ ] Driven by listing status + transaction state — single source of truth from the server
- [ ] 🧪 **Test:** every state change reflects on BOTH devices within one poll cycle; refresh mid-flow shows the correct step (state is server-derived, not client-remembered)

## Task 4.5 — Transactions service (the state machine)
- [ ] `services/transactions.ts` — the ONLY writer of `listings.status` (ARCHITECTURE.md §3.5): seller **Reserve for this buyer** (`active→reserved`, creates transaction) · either side cancels (`reserved→active`, transaction removed) · seller **Mark as Sold** · buyer **Confirm received** (`buyer_confirmed_at` set, `→closed`)
- [ ] Guards: only the seller reserves/marks; only that chat's buyer confirms; UNIQUE `transactions.listing_id`
- [ ] Reserved/closed listings leave search; others see "Reserved — see similar" (WORKFLOW.md §9)
- [ ] 🧪 **Test:** concurrent double-reserve script → exactly one transaction row; buyer trying to mark-sold / stranger trying to confirm → rejected; reserved book gone from search results

## Task 4.6 — 72h auto-expiry (lazy)
- [ ] On chat/listing read: unconfirmed reservation older than 72h → revert `reserved→active`, delete/void transaction, notify both (D-043 — no cron)
- [ ] 🧪 **Test:** fake `seller_marked_at` to 73h ago in DB → next page load flips status to `active` + both accounts have the notification; a 71h reservation is untouched

## Task 4.7 — Ratings
- [ ] After close: one-tap 👍/👎 prompt for both sides, skippable; unique per (transaction, rater) (D-007)
- [ ] Profile 👍 count live (count of thumbs-up received); shown on seller card (Task 3.3 placeholder replaced)
- [ ] 🧪 **Test:** both sides rate once — second attempt blocked server-side; skip works; 👍 count updates on profile and seller card

## Task 4.8 — Chats tab & notifications
- [ ] Chats tab: conversation list (listing thumbnail, last message, unread dot), sorted by recent
- [ ] `chat_message` notifications feed the badge; "confirm received" + "rate now" emails via Resend (best-effort)
- [ ] 🧪 **Test:** unread dot appears/clears correctly; deep link from notification opens the right chat; emails arrive for confirm + rate moments

---

## Phase gate — tick to close the phase
- [ ] All 8 tasks fully ticked
- [ ] 📱 **Two-device lifecycle on production:** chat → reserve → sold → confirm → rate → `closed` + 👍 visible — executed by two team members on their own phones
- [ ] Polling economics verified: one open chat ≈ 15 requests/min max, zero when hidden (ARCHITECTURE.md §6 depends on this)
- [ ] Decisions made this phase logged in `DECISIONS.md`
