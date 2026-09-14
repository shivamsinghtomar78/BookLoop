# Phase 4 — Chat & Transactions

**Goal:** the trust core — chat, reserve, hand over at school, confirm, rate. The hardest phase.
**Demo at the end:** two phones, full lifecycle: chat → reserve → mark sold → confirm → both rate → listing closed, 👍 on seller's profile.
**Depends on:** Phase 3. **Rough effort:** 6–9 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

> **Status 14 Sep 2026:** built and fully tested. Realtime = **socket.io** per user instruction (D-055 — push-only server in `realtime/`, `npm run realtime`; all writes stay in server actions which `pg_notify`; D-037 polling remains as automatic fallback). Service layer: 13/13 checks ✓ (incl. concurrent double-reserve → exactly 1 transaction row, and 72h expiry). **Two-browser lifecycle over live socket.io: PASSED end-to-end** — message cross-browser ~3.4s, reserve→buyer state ~5.5s, confirm → both rate prompts → 👍 → listing closed, chat bar gone. Flow refinement: buyer's "Confirm received" is available while reserved (seller can never close alone); seller's "Handed over" is a nudge (notification + email).

---

## Task 4.1 — Chat creation & access control
- [x] `services/chat.ts`: get-or-create per (listing, buyer) — unique-constraint race handled; no self-chat; participant check on EVERY read/write
- [x] Rate limit: 10 new chats/day per buyer (DB count — D-039)
- [x] 🧪 **Test:** service ✓ — double-open returns the same chat; self-chat rejected; a third account reading the chat rejected

## Task 4.2 — Realtime + polling fallback (the cost-critical task)
- [x] **socket.io** (D-055): standalone push-only server (`realtime/server.ts`) — JWT handshake (`/api/chat-token`, 5-min HS256), per-room participant re-check on join, Postgres LISTEN on `chat_events`, rooms `chat:<id>`; client auto-reconnect with token re-mint
- [x] Writes stay in server actions → `pg_notify` after each write (single write path); `GET /api/chats/[id]/messages?after=<id>` = incremental history + state snapshot
- [x] Polling fallback per D-037 when the socket is down: 4s visible → 15s idle → paused hidden; paused entirely while the socket is live
- [x] Send: optimistic append with rollback; 1 msg/sec server-side limit
- [x] 🧪 **Test:** two-browser ✓ — messages delivered cross-browser in ~3.4s with "⚡ live" indicator (no reload); 1 msg/sec enforced at service level ✓

## Task 4.3 — Chat screen UX
- [x] Message list + composer (Enter sends, Shift+Enter newline); **quick-ask chips** for the buyer's first message (D-044); pinned **school pickup card** with "Suggest a time" quick action (D-005); listing summary header → taps back to the listing
- [x] 🧪 **Test:** two-browser ✓ — quick-ask chip sent the opener; composer round-trip verified both directions

## Task 4.4 — Status stepper
- [x] Chatting → Reserved → Meet at pickup → Done → Rate, identical both sides, derived ONLY from server state (`getTxState`) — refresh-safe
- [x] 🧪 **Test:** two-browser ✓ — buyer's UI advanced on the seller's reserve via socket push (~5.5s incl. refetch), rate prompt appeared for both on confirm

## Task 4.5 — Transactions service (the state machine)
- [x] `services/transactions.ts` — the ONLY writer of `listings.status`: seller reserves (tx row + `active→reserved`), either side cancels (unconfirmed only), seller "handed over" nudge (notification + email), buyer confirms (`buyer_confirmed_at` + `→closed`)
- [x] Guards: only seller reserves/nudges; only the tx's buyer confirms; UNIQUE `transactions.listing_id`
- [x] Reserved/closed listings leave search (status filter, Phase 3); detail page shows "Reserved — see similar"
- [x] 🧪 **Test:** service ✓ — buyer-reserve rejected; **concurrent double-reserve → exactly 1 transaction row**; seller-confirm rejected; buyer confirm closed the listing

## Task 4.6 — 72h auto-expiry (lazy)
- [x] `expireStaleReservation` on chat page, poll endpoint, and listing detail reads — unconfirmed reservation > 72h → tx voided, listing relisted, both sides notified (D-043, no cron); never throws
- [x] 🧪 **Test:** service ✓ — `seller_marked_at` faked to 73h → reverted to active + notifications; confirmed deals untouched

## Task 4.7 — Ratings
- [x] One-tap 👍/👎 after close, both sides, skippable (prompt just remains); unique per (transaction, rater); profile + seller-card 👍 counts live (Phase 3 wiring now shows real data)
- [x] 🧪 **Test:** service ✓ — both sides rated once, duplicate rejected; two-browser ✓ — 👍 flow end-to-end, seller card updated

## Task 4.8 — Chats tab & notifications
- [x] `/chats`: conversation list (both roles), cover thumb, last message, status tag, **unread dot** via unread `chat_message` notifications (one per user+listing at a time — no spam); cleared on chat open
- [x] Notifications: `chat_message` deep-links to `/chats`; reserve/cancel/confirm/rate-now moments create `confirm_handover` notifications; confirm + rate-now **emails** best-effort
- [x] 🧪 **Test:** service ✓ (notification rows verified in lifecycle); rate-now email rendered via dev fallback; badge-timing check with two devices ⏳ manual

---

## Phase gate — tick to close the phase
- [x] All 8 tasks ticked (one ⏳ manual badge-timing check noted)
- [x] 📱 **Two-device lifecycle:** PASSED via two isolated browser contexts on the production build — chat → reserve → nudge → confirm → rate → `closed` + 👍 visible *(re-run on two real phones against production when Vercel is connected)*
- [x] Polling economics: polling fully pauses while the socket is live; fallback stays within ARCHITECTURE.md §6 budgets
- [x] Decisions logged: D-055 (socket.io realtime, supersedes half of D-022)

### Realtime deployment note *(updated by D-060)*
Realtime now deploys **with the app on Vercel**: `api/socketio.ts` is a vanilla Vercel Function exporting the Socket.IO `http.Server` (Vercel Functions support WebSockets on Fluid Compute). Same-origin, no extra host, no CORS. `realtime/server.ts` remains the local-dev twin (`npm run realtime`, :4001) since root `api/` functions don't run under `next dev`; `NEXT_PUBLIC_REALTIME_URL` stays as an optional external-host override. The D-037 polling fallback still covers any socket gap.
