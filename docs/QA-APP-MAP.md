# BookLoop — QA App Map

Snapshot of the application surface as it exists for the QA pass (2026-10-29).
Source of truth is the code; this map is the checklist the test suite and report
are organized against.

## 1. Product in one paragraph

BookLoop is a school book marketplace. Students list textbooks, reference
guides, competitive-exam books and novels to **sell**, **exchange** or
**donate**. Buyers search and filter by class, subject, category and price, open
a chat, agree on a handover, and the seller reserves the book. The seller gets a
**BookLoop ID** (`BL-####`) and QR code for each listing. Access to contact is
gated behind a chat, so phone numbers are never published. Audience: students
aged ~12–18 on mid-range Android over slow data, plus parents.

## 2. Runtime topology

| Piece | Technology | Where it runs |
|---|---|---|
| Web | Next.js 16 App Router, React 19, Tailwind v4 | Vercel/InstaCloud web service or Docker `runner` stage |
| Realtime | socket.io server + Postgres `LISTEN/NOTIFY` | InstaCloud `bookloop-realtime` / Docker `realtime` stage (port 4001) |
| Fallback | 4 s REST polling of `/api/chats/[id]/messages` | Browser when socket is unavailable |
| DB | Neon Postgres (HTTP driver for app, `pg` for realtime/scripts) | Neon |
| Photos | UploadThing | external |
| Auth | Better Auth (email + password, testing mode D-059) | same Next app, `/api/auth/*` |

Request path: browser → Next server action / route handler → service
(`src/services/*`) → Drizzle → Neon. Chat writes go through server actions and
fan out via socket.io / polling.

## 3. Route map

| Route | Auth | Purpose | Key modules |
|---|---|---|---|
| `/` | public | Hero, search entry, how-it-works, departments, shop-by-class, latest listings | `components/marketing/*`, `components/book-card.tsx` |
| `/search` | public | Query + filters (class, subject, category, mode, price, condition), sort, pagination | `app/(main)/search/page.tsx`, `components/search/*`, `services/listings.ts` |
| `/listings/[id]` | public (chat needs auth) | Listing detail, photos, seller card, QR + BookLoop ID, wishlist, report a problem | `app/(main)/listings/[id]/page.tsx`, `report-problem.tsx`, `wishlist-heart.tsx` |
| `/sell` | user | Create/edit listing: mode, category-specific fields, condition, price, photos | `components/sell/sell-form.tsx`, `photo-uploader.tsx`, `app/(main)/sell/actions.ts` |
| `/exchange` | public | Exchange board: wants/offers matching | `services/exchange.ts` |
| `/donate` | public | Donation board + impact stats | `services/impact.ts`, `components/donor-share.tsx` |
| `/chats` | user | Chat inbox | `app/(main)/chats/page.tsx` |
| `/chats/[id]` | participant | Conversation, offer, reserve/cancel, handover stepper, rating | `components/chat/chat-screen.tsx`, `stepper.tsx`, `app/(main)/chats/chat-actions.ts` |
| `/notifications` | user | In-app notifications (alert matches, chat, confirm handover) | `app/(main)/notifications/page.tsx` |
| `/profile` | user | Own listings, wishlist, alerts, account actions | `app/(main)/profile/page.tsx` |
| `/admin/stats` | admin (`ADMIN_EMAILS`) | Pilot metrics | `app/(main)/admin/stats/page.tsx` |
| `/sign-in`, `/sign-up` | — | **Do not exist as pages**; auth is a dialog from any gated action | `components/auth/auth-sheet.tsx` |
| `/privacy`, `/terms` | — | **Do not exist** | — |
| password reset | — | **No flow** | — |

Layouts/loading/error shells: `src/app/layout.tsx`, `(main)/layout.tsx`,
`(main)/loading.tsx`, per-route `loading.tsx`, `src/app/error.tsx`,
`src/app/not-found.tsx`. No route-level `error.tsx` under `(main)` and no
`global-error.tsx`.

PWA: `components/install-prompt.tsx` + manifest only; no service worker/offline
cache.

## 4. Server actions (write surface)

All are POST server actions gated by `requireUser()` unless noted.

| Action file | Exports | Notes |
|---|---|---|
| `(auth)/actions.ts` | `signUpAction`, `signInAction`, `signOutAction` | Zod → Better Auth → `createProfile`. Signup is **not atomic** (auth user can exist without a profile if profile insert fails). No school-ID field. |
| `(main)/sell/actions.ts` | `publishListingAction`, `updateListingAction`, `deleteListingAction` | Zod → `services/listings` → revalidate |
| `(main)/buy-actions.ts` | `toggleWishlistAction`, `createAlertAction`, `deactivateAlertAction`, `markNotificationsReadAction` | |
| `(main)/chats/chat-actions.ts` | `openChatAction`, `sendMessageAction`, `reserveAction`, `cancelReservationAction`, `askConfirmAction`, `confirmReceivedAction`, `rateAction` | Reservation, handover, rating |
| `(main)/feedback-actions.ts` | `reportProblemAction` | Guest allowed (nullable `feedback.user_id`) |

## 5. HTTP API

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/[...all]` | * | — | Better Auth catch-all (signup, login, session, signout) |
| `/api/chat-token` | GET | session | Short-lived chat JWT; falls back to a localhost secret outside dev? (see §10) |
| `/api/chats/[id]/messages` | GET | participant | Polling fallback (`?after=` cursor) |
| `/api/notifications` | GET | session | Unread count / list |
| `/api/uploadthing` | GET/POST | session | UploadThing router (`src/app/api/uploadthing/core.ts`) |
| `/api/health` | GET | public | Liveness for Docker/InstaCloud; currently does not report integration config |

No `/api/listings`, no public REST API, no sitemap/robots/OG image routes.
No `middleware.ts`; gating is per-page/server-action.

## 6. Database

Enums: `category` (textbook, reference, competitive, novel), `mode` (sell,
exchange, donate), `condition` (like_new, good, fair, worn), `listing_status`
(active, reserved, closed, deleted), `notification_type` (alert_match,
chat_message, confirm_handover).

| Table | Key columns | Constraints / indexes |
|---|---|---|
| `users` | `auth_id`, email, full_name, school_name, age, class, student_id, verified | unique `auth_id`, email, `student_id`; **no index on class/verified** |
| `listings` | `bookloop_id`, seller_id, title, category, mode, class, subject, exam, genre, condition, price_inr, status | unique `bookloop_id`; `listings_search_idx(status, category, class, subject)`; `listings_seller_idx` |
| `listing_photos` | listing_id, url, sort_order | cascade delete; **no index on listing_id** |
| `chats` | listing_id, buyer_id | unique (listing_id, buyer_id) |
| `messages` | chat_id, sender_id, body, created_at | `messages_chat_time_idx(chat_id, created_at)` |
| `transactions` | listing_id **unique**, seller_id, buyer_id, mode, seller_marked_at, buyer_confirmed_at | one closure per listing |
| `ratings` | transaction_id, rater_id, ratee_id, thumbs_up | unique (transaction_id, rater_id) |
| `wishlist_items` | user_id, listing_id | unique pair |
| `book_alerts` | user_id, keyword, category, class, subject, active | no index |
| `feedback` | user_id (nullable), body, page | no index |
| `notifications` | user_id, type, text, listing_id, read_at | `notifications_user_idx(user_id, read_at)` |
| Better Auth | `"user"`, `session`, `account`, `verification` | — |

No migration files exist (`drizzle/` is absent); schema is applied with
`drizzle-kit push`. `user_id`/`seller_id` FKs have no explicit `on delete`
behavior (default `NO ACTION`).

## 7. Roles and permissions

| Capability | Guest | Student (unverified) | Student (verified) | Admin |
|---|---|---|---|---|
| Browse/search/listing detail | ✓ | ✓ | ✓ | ✓ |
| Sign up / in | ✓ (dialog) | — | — | — |
| List a book | — | ✓ (photos required) | ✓ | ✓ |
| Wishlist / alert | — | ✓ | ✓ | ✓ |
| Chat / reserve / confirm | — | ✓ (own chats only) | ✓ | ✓ |
| Rate after handover | — | ✓ (participant) | ✓ | ✓ |
| `/admin/stats` | — | — | — | ✓ |

Enforcement: `requireUser()` in services/actions; participant checks in
`services/chat.ts`; admin allow-list from `ADMIN_EMAILS`. `users.verified` and
`student_id` exist but **nothing in the UI or actions sets or reads them** (no
school-ID capture, no approval queue).

## 8. Domain rules

- Modes: sell (price 1–9999 ₹), exchange (`wants_book`), donate (free).
- Listing status: `active → reserved → closed`; `deleted` soft delete.
- Reservation expires lazily after **72 h** on read (`RESERVATION_EXPIRY_HOURS`).
- Abuse caps (`LIMITS`): 20 active listings/user, 10 new chats/day, 1 s between
  messages, 4 photos/listing, password ≥ 8.
- BookLoop ID: `BL-` + zero-padded sequence, unique, shown with a QR code.
- Search filters: query text, category, mode, class, subject, exam, price range,
  condition; sort newest/price; pagination exists in `services/listings.ts`.
- Contact details are never exposed; all coordination happens in chat.

## 9. Integrations and configuration

| Variable | Required | Used by |
|---|---|---|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | yes | app (HTTP) / realtime + scripts (`pg`) |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | yes | Better Auth |
| `CHAT_JWT_SECRET` | yes | `/api/chat-token` + realtime |
| `NEXT_PUBLIC_REALTIME_URL` | optional | browser socket URL; empty = polling |
| `UPLOADTHING_TOKEN` | optional (but photos are mandatory → effectively required to publish) | upload router |
| `ADMIN_EMAILS` | optional | `/admin/stats` |
| `TEAM_INBOX_EMAIL` | optional | report-a-problem mail |
| `APP_ORIGINS` | optional | CORS allow-list (realtime) |

Docker: `Dockerfile` `runner` (web, port 3000) and `realtime` (port 4001)
targets; `docker-compose.test.yml` maps them to 3100/4101 against the QA Neon
branch.

## 10. Known defects carried into the QA pass

Recon findings to verify and fix (each gets an ID in `QA_LOG.md` / `REPORT.md`):

1. **Upload is unconfigured in production** (`UPLOADTHING_TOKEN` absent) while a
   listing requires ≥ 1 photo → sellers cannot publish. No UI explains why.
2. **Test tooling points at production Neon**: `docker-compose.yml` and the
   legacy E2E use the shared branch; `db:seed` can wipe data and its `/prod/i`
   guard does not catch Neon hostnames. Mitigated in Phase 0 by
   `.env.test.local` + endpoint guard + standalone test compose.
3. **Contrast**: primary button 3.38:1, muted text 4.37:1 (below 4.5:1).
4. **Invalid card markup**: a `<button>` (wishlist heart) nested inside the
   card’s `<a>` on every book card.
5. **Chat a11y**: no live region for incoming messages; errors are visual-only.
6. **Polling cost**: chat polling issues ~12–14 queries every 4 s.
7. **No pagination** on chats list, notifications, or transaction history.
8. **Missing indexes**: `listing_photos(listing_id)`, `book_alerts(user_id)`,
   `feedback(created_at)`, `listings(status, created_at)` for newest-first.
9. **No privacy/terms pages, no password reset, no OG/SEO metadata, no JSON-LD**,
   QR only on the sell-success screen.
10. **Auth hardening gaps**: no `trustedOrigins`, no explicit rate limits, no
    secure-cookie/CSRF config, non-atomic signup, localhost fallback secret in
    `chat-token` outside dev.
11. **Security headers**: `X-Frame-Options`/`nosniff`/`Referrer-Policy` present;
    no HSTS, no CSP (even report-only), no `Cross-Origin-Opener-Policy`.
12. **Realtime CORS** trusts only `BETTER_AUTH_URL`, not the full
    `APP_ORIGINS`; realtime may use a pooled Neon URL for `LISTEN`.

## 11. Seeded QA fixtures (`src/db/seed.ts`)

- Accounts: `seller1..5`, `buyer1..4`, `admin` at `@test.bookloop.local`,
  password `Bookloop!2345`; `buyer4` is unverified (pending approval);
  student IDs `QA#########`.
- 55 listings: 27 textbooks (classes 6–12), 8 reference, 4 competitive
  (JEE/Olympiad), 8 exchange, 8 donate; BookLoop IDs `BL-0001…BL-0055`;
  rows 0/4/27 exercise active/reserved/closed.
- 110 photos, 3 chats (negotiating/reserved/completed), 13 messages,
  2 transactions, 1 rating, 3 wishlist items, 2 alerts, 3 notifications.
- Marker table `_bookloop_test_meta(run_id, label, seeded_at)` proves the seed
  belongs to the current QA branch.

## 12. Test matrix entry points

Public: `/`, `/search` (query/filter/sort/pagination), `/listings/:id`,
`/exchange`, `/donate`, 404.
Auth: signup dialog (validation, duplicate email, weak password, age/class),
sign-in (wrong password, unknown email), signout, session persistence, gated
redirect.
Seller: publish (all 3 modes, photo upload, validation, double-submit), edit,
delete, 20-listing cap.
Buyer: wishlist, alert create/deactivate, chat open, message, reserve,
confirm, rate, notifications.
Safety/security: IDOR on `/chats/:id`, `/api/chats/:id/messages`, listing edit/
delete by non-owner, admin route, XSS in title/message/profile, SQLi in search,
upload validation, headers, cookie flags, CORS.
Quality: 360×640, 390×844, 768×1024, 1440×900 (Chromium + WebKit), axe,
keyboard-only, reduced motion, Lighthouse on `/`, `/search`, `/listings/:id`.
