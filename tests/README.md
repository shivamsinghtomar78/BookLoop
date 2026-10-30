# QA test suite (Playwright)

End-to-end, accessibility, security and performance checks for BookLoop.
It runs against a **built** app and a **disposable** database — never Neon
production (the DB helper refuses `.neon.tech` hosts).

## Prerequisites

1. A disposable Postgres with the seed loaded:
   ```bash
   docker run -d --name bookloop-qa-pg -p 55432:5432 \
     -e POSTGRES_PASSWORD=qa -e POSTGRES_DB=bookloop_qa postgres:16-alpine
   npm run db:test:push     # drizzle-kit push against .env.test.local
   npm run db:test:seed     # 55 listings + test accounts
   ```
2. A production build of the app pointed at that database:
   ```bash
   DATABASE_URL=postgresql://postgres:qa@127.0.0.1:55432/bookloop_qa \
   BETTER_AUTH_URL=http://localhost:3100 \
   BETTER_AUTH_SECRET=qa-local-secret-0123456789abcdef \
   CHAT_JWT_SECRET=qa-local-chat-0123456789abcdef \
   AUTH_RATE_LIMIT=off \
   PHOTO_DAILY_LIMIT=1000 \
   npm run build && npx next start -p 3100
   ```
3. `.env.test.local` with `TEST_DATABASE_URL`, `TEST_DB_CONFIRM=bookloop-test`
   and `TEST_DB_LABEL` (already set for the local container above).

## Run

```bash
npm run test:qa                        # all 8 projects (4 viewports × 2 browsers)
QA_BASE_URL=http://localhost:3102 npm run test:qa
npm run test:qa:a11y                   # axe only
npx playwright test --project=chromium-390x844   # one viewport
```

Seeded logins (password `Bookloop!2345`): `seller1…5`, `buyer1…4`,
`admin@test.bookloop.local` — all `@test.bookloop.local`.

## What the suite covers

| Spec | Focus |
|---|---|
| `auth.spec.ts` | guest redirects, credential rules, cookie flags, sign-out |
| `browse.spec.ts` | hero, mode tabs, exchange/donate, footer policies |
| `search.spec.ts` | query→URL, filter composition, empty state, junk params |
| `listing.spec.ts` | detail facts, contact privacy, wishlist, 404 status |
| `sell.spec.ts` | validation, photo upload (local WebP path), publish |
| `chat.spec.ts` | gated entry, send, participant isolation |
| `reservation.spec.ts` | full four-gate deal with two accounts: reserve → accept → hand over → confirm (+ negative action checks, DB timestamps) |
| `chat-layout.spec.ts` | 390×844 full-bleed thread with pinned composer; 1440×900 two-pane list + thread |
| `a11y.spec.ts` | axe WCAG 2.1 A/AA on 9 pages (fails critical/serious) |
| `security.spec.ts` | headers, CSRF origins, auth boundaries, uploads, admin gate |
| `performance.spec.ts` | LCP/CLS budgets, warm TTFB |

Clicking tests call `gotoHydrated()` — the app marks
`<html data-hydrated="1">` once React is live, so a click can't land on the
server-rendered HTML before handlers attach. The sell form is heavier than the
shell, so `sell.spec.ts` additionally waits for `form[data-ready="1"]` before
typing; otherwise React Hook Form hydration can wipe values filled a moment
too early.

## Cleanup

Global teardown deletes listings titled `QA E2E …`, QA users
(`qa-e2e-*@test.bookloop.local`) and their photo blobs. Re-seed to reset chats
and wishlists touched by the suite. Set `QA_KEEP_DATA=1` to skip teardown.

Artifacts: `playwright-report/`, `artifacts/playwright/results.json`, traces in
`test-results/`.
