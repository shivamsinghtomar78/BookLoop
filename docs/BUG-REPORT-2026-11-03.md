# BookLoop — two-account production test and bug report

**Date:** 2026-11-03
**Target:** https://bookloop-tan.vercel.app (Vercel production, Neon Postgres)
**Method:** real browser runs against production. Every write went through the UI;
database access was read-only assertions.

**Accounts**

| Role | Account | Notes |
|---|---|---|
| Seller | `qa.seller.q4e6q@example.com` (user #23) | created through the real sign-up sheet during this run |
| Buyer | `shivamtomar0819@gmail.com` (Tanishka, user #20) | supplied by the owner |

**Test artifacts:** `artifacts/two-account-e2e.mjs`, `artifacts/surface-check.mjs`
(gitignored). Screenshots in `artifacts/two-account/`.

---

## 1. Result

The complete purchase lifecycle works end-to-end in production with two real
accounts:

1. New seller signs up through the sheet, profile row created, auto-signed in.
2. Seller publishes a textbook with a photo, previews it, edits the price (₹150 → ₹140).
3. Buyer finds it by exact search, by search-bar typing, and with category + class
   + condition + price filters; a `₹200+` filter correctly excludes it.
4. Buyer saves it to the wishlist (heart + profile), opens chat and messages.
5. Seller receives the message via polling and replies.
6. Mobile 390×844: listing CTA visible, chat composer pinned, no horizontal overflow.
7. Gate 1 seller reserves → gate 2 buyer accepts (still reserved) → gate 3 seller
   hands over (still reserved) → gate 4 buyer confirms (listing closed).
8. Both sides rate thumbs-up; ratings rows stored.
9. Notifications produced for both accounts; pages render.
10. Guards: `/sell` and `/chats` redirect guests; admin stats hidden; guest profile
    shows sign-up; 404 page; invalid listing/chat IDs render 404 UI.
11. Exchange/donate form states, report-problem dialog, duplicate-signup and
    wrong-password errors, alert create + deactivate, logout.
12. `/api/health` → `{"ok":true,"db":true}`.

**Two product defects were found and fixed; one low-severity observation remains open.**

| ID | Severity | Summary | Status |
|---|---|---|---|
| BUG-01 | Medium | After logout the header never shows Log in / Sign up until a full reload | Fixed |
| BUG-02 | Low | Every chat open requests `/api/chat-token` and logs a 503 on Vercel | Fixed |
| OBS-01 | Low | Soft 404s (unknown listing/chat, non-admin stats) return HTTP 200 | Open, documented |

---

## 2. BUG-01 — Logout leaves the header without auth actions

**Severity:** Medium (confusing dead-end for a signed-out user)
**Where:** `src/components/auth/profile-actions.tsx`, header via
`src/components/auth/header-auth.tsx`

**Reproduction**

1. Sign in and open `/profile`.
2. Tap **Log out**.
3. Land on `/` with no session (`/api/auth/get-session` → `null`), but the header
   shows neither **Log in** nor **Sign up**. They only appear after a hard reload.

**Root cause**

Logout uses the `signOutAction` server action. It clears the cookie and revokes the
session server-side, but the shared Better Auth client session atom
(`useSession`) still holds the old session. `HeaderAuth` sees `session` truthy and
renders nothing (authed actions live in TopNav), so the guest CTAs stay missing
until the page reloads and the atom re-initialises.

**Fix**

After a successful server logout, refetch the client session atom before navigating:

```ts
const { refetch } = useSession();
// ...
if (res.ok) {
  await refetch(); // sync the shared atom after the server cleared the cookie
  toast.success("Logged out");
  router.push("/");
  router.refresh();
}
```

**Regression test:** `tests/e2e/auth.spec.ts` → "log out clears the session" now also
asserts the header **Log in** button is visible after logout.

---

## 3. BUG-02 — Chat requests a realtime token that Vercel cannot serve

**Severity:** Low (no functional break; console/network noise, wasted request)
**Where:** `src/components/chat/chat-screen.tsx`,
`src/app/(chat)/chats/[id]/page.tsx`

**Reproduction**

Open any chat on the Vercel deployment. The network panel logs:

```
503 GET /api/chat-token
```

and the browser console records "Failed to load resource: 503". The chat still
works because it falls back to REST polling.

**Root cause**

The chat client always calls `/api/chat-token`. On Vercel without
`NEXT_PUBLIC_REALTIME_URL`, that route deliberately returns 503 (D-062: serverless
functions must not hold a Postgres `LISTEN`). The response is expected, but asking
for it on every chat open is noise and makes monitoring look unhealthy.

**Fix**

The server now tells the client whether realtime exists, and the client skips the
socket path entirely when it does not:

```ts
// chats/[id]/page.tsx
const REALTIME_ENABLED = !!process.env.NEXT_PUBLIC_REALTIME_URL || !process.env.VERCEL;
<ChatScreen … realtime={REALTIME_ENABLED} />
```

```ts
// chat-screen.tsx
useEffect(() => {
  if (!props.realtime) return; // polling only — never ask for a token
  …
}, [props.chatId, props.realtime, append, refetch]);
```

Local development and any deployment with `NEXT_PUBLIC_REALTIME_URL` keep socket
push; Vercel goes straight to polling with a clean network log.

---

## 4. OBS-01 — Soft 404s return HTTP 200 (open)

**Severity:** Low (status/SEO hygiene, no data exposure)
**Where:** route-level `loading.tsx` boundaries + `notFound()` in:
`src/app/(main)/listings/[id]/page.tsx`, `src/app/(chat)/chats/[id]/page.tsx`,
`src/app/(main)/admin/stats/page.tsx`

Unknown listings, unknown chats, and `/admin/stats` for non-admins render the
styled **Page not found** screen, but the response status is **200** instead of 404.
The `loading.tsx` boundary flushes the shell before `notFound()` resolves
(Next.js streaming), so the status is already committed.

No admin metrics or listing data are returned to non-admins; the content and guard
behaviour are correct.

**Options**

- Accept this as a known Next.js streaming trade-off (current state).
- Or gate `/admin/*` earlier (proxy/middleware with an admin claim) and validate
  detail IDs before the stream starts, so a real 404 status can be sent.
  This needs a DB lookup or token claim in the edge layer — more moving parts than
  the pilot warrants today.

---

## 5. Test data created (production)

All data is between test accounts; no real user account was modified.

| Item | Value |
|---|---|
| Seller account | `qa.seller.q4e6q@example.com` (user #23, "Aarav QA", BookLoop QA School) |
| Listing | #82 "Science QA q7x0f" — closed after the deal |
| Chat / transaction | chat #28, transaction #20 (all four timestamps set) |
| Ratings | buyer → seller 👍, seller → buyer 👍 |
| Notifications | 3 for the seller, generated by the deal |
| Wishlist | toggled on and back off during the test |
| Alert | unique test keyword created and deactivated (no email can match it) |
| Older smoke data | listing #80 / chat #26 / tx #19 (`e2e-*` accounts); listing #81 deleted; chat #27 |

The buyer account (Tanishka) now has one completed purchase and one rating given.
Say the word if you want this cleaned up (soft-delete #82/#80, remove synthetic
accounts and their chats/transactions).

---

## 6. Verification after fixes

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — clean
- Regression test added in `tests/e2e/auth.spec.ts`
- Local production build run with `VERCEL=1` (no `NEXT_PUBLIC_REALTIME_URL`),
  same conditions as Vercel — 5/5 checks in `artifacts/local-verify.mjs`:
  - logout: guest **Log in** appears immediately, no reload
  - chat: **0** `/api/chat-token` requests; REST polling still fires
  - closed chat still correctly hides the composer
- Production re-verification on https://bookloop-tan.vercel.app after deploying
  commit `7578ba4` — 5/5 checks in `artifacts/local-verify.mjs`:
  - logout: guest **Log in** appears immediately, no reload
  - chat: **0** `/api/chat-token` requests; REST polling still fires
  - closed chat still correctly hides the composer
