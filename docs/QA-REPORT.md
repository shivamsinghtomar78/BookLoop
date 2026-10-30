# BookLoop — QA report

**Scope:** every route, API, form and flow in the pilot app, tested the way a
student on a mid-range Android phone and a parent on a laptop would use it.
**When:** 2026-10-29 → 2026-10-30 · **Build:** local production build
(`next build` + `next start`) · **Data:** disposable Postgres seeded with
`npm run db:test:seed` (55 listings, 10 accounts).

> Production data was never written to. The QA database is a local container;
> the staging instance was only read.

---

## 1. Scorecard

| Area | Before | After | Notes |
|---|---|---|---|
| Core flows (browse → chat → handover) | 3/5 | 4.5/5 | stable; realtime falls back to polling by design |
| Auth & sessions | 3/5 | 4/5 | cookie flags, origins, rate limits added |
| Sell flow (incl. photos) | 2/5 | 5/5 | **was broken in production** — fixed |
| Accessibility (axe, serious) | 59 nodes | 0 | token-level contrast fixes |
| Layout stability (CLS) | 0.217 home | 0.018–0.064 | footer streaming shift removed |
| Security headers | 2/5 | 4/5 | HSTS, COOP, report-only CSP, nosniff |
| Trust & compliance | 1/5 | 4/5 | /privacy + /terms now exist |
| SEO / sharing | 1/5 | 4/5 | metadata, OG image, robots, sitemap |
| Performance (warm TTFB) | ~0.1 s local | ~0.1 s | dev-mode slowness was Turbopack-only |
| Mobile polish (360/390) | 4/5 | 4.5/5 | hydration-race click loss noted |
| Automated coverage | 0 tests | 398 tests × 8 projects | `npm run test:qa` |

---

## 2. Defects found and fixed

| # | Severity | Area | Defect | Fix | Verified by |
|---|---|---|---|---|---|
| 1 | **Critical** | Sell | Publishing with photos failed on production: "Missing token. Please set `UPLOADTHING_TOKEN`…" | Zero-config upload path (`/api/photos`, sharp → WebP → Postgres) + client downscale; UploadThing kept when configured | browser publish + `GET` WebP + detail render |
| 2 | **Critical** | Data layer | `db.batch` only exists on Neon HTTP — local/CI Postgres threw on every multi-write (sell, reserve, cancel, confirm) | `atomically()` picks `batch` or `transaction` per driver | sell/reserve flows against pg |
| 3 | High | A11y | 59 serious contrast nodes (`text-subtle`, primary on soft, footer at 80%) | token values darkened; opacity removed | axe 0 serious |
| 4 | High | Layout | Home CLS 0.217 — footer at y=673 in the streaming shell then jumped off-screen | first-viewport reservation on `<main>`; header skeleton matches settled cluster | `scripts/qa-cls.mjs` |
| 5 | High | Trust | `/privacy` and `/terms` 404; no contact or data-deletion statement | plain-language pages, footer links, sitemap entries | browse spec |
| 6 | High | Auth | No trusted origins, no rate limits, cookies not HTTPS-only | `trustedOrigins`, NAT-aware per-IP rules, secure cookies when the origin is HTTPS | security spec |
| 7 | High | Headers | Only nosniff/referrer/frame-options | + HSTS, COOP, Permissions-Policy, CSP report-only, powered-by removed | security spec |
| 8 | Medium | Realtime | CORS allowlist was a single origin; no prod guard | `APP_ORIGINS` list; exits in prod without `BETTER_AUTH_URL` | code + local socket run |
| 9 | Medium | Forms | Validation errors invisible to screen readers | `role="alert"`; chat log is `aria-live="polite"` | axe + manual |
| 10 | Medium | Errors | Root layout crashes had no branded boundary | `app/global-error.tsx` | build |
| 11 | Medium | Sharing | Bare title; no OG/Twitter card; no robots/sitemap | metadataBase, OG image route, robots (no school-only pages), sitemap | HTTP 200 + route list |
| 12 | Low | 404 | Missing listing / non-admin admin page stream a 404 body with HTTP 200 | documented tradeoff (route-level skeleton); noindex; API routes still strict | security/listing specs |
| 13 | Low | UI | Header auth skeleton 80×32 vs settled 131×89 → small shift | placeholder sized to match | CLS script |
| 14 | Low | UX | Taps in the first ~300 ms land on pre-hydration HTML | hydration marker for tests; noted for a "tap buffering" follow-up | suite reliability |
| 15 | **Critical** | Dependencies | 3 critical advisories: `next/og` RCE (we ship `/opengraph-image`), better-auth rate-limit bypass on Postgres, proxy-addr IP spoofing | next 16.4.3, better-auth 1.7.14, zod 4.6.7, sharp 0.35.5, `proxy-addr` override 2.0.8 | `npm audit --omit=dev`: 3 critical → 0 |
| 16 | Medium | A11y | Bell unread badge tripped `label-content-name-mismatch` (WCAG 2.5.3) once a user had unread notifications | badge moved outside the link; count stays in the link's label | axe clean on 9 pages × 8 projects |
| 17 | Low | Search UX | Filter rows clipped mid-word on phones; no result count or one-tap reset | edge fade on scroll rails; "N books" + Clear all; Clear all keeps URL state authoritative | search spec + 390px review |
| 18 | Low | Listing detail | Sparse page on phones (photos, price, seller only) | Details grid: class, subject, category, condition, edition, listed date | screenshot + listing spec |

---

## 3. What was tested

- **Routes:** `/`, `/search`, `/exchange`, `/donate`, `/listings/:id`, `/sell`,
  `/chats`, `/chats/:id`, `/profile`, `/notifications`, `/admin/stats`,
  `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`,
  `/api/health`, `/api/auth/*`, `/api/photos*`, `/api/chat-token`,
  `/api/notifications`, `/api/chats/:id/messages`, `/api/uploadthing`.
- **Flows:** guest browsing, sign-up/login/logout, listing browse & filters,
  wishlist, listing detail, sell with photo upload & preview & publish, chat
  open/send, reservation state machine (legacy E2E), report-a-problem.
- **Browsers/viewports:** Chromium + WebKit at 360×640, 390×844, 768×1024,
  1440×900, reduced motion, `en-IN` / Asia/Kolkata.

---

## 4. How to reproduce

See `tests/README.md` (DB container, seed, build, `npm run test:qa`).
Results: `artifacts/playwright/results.json`, HTML report in
`playwright-report/`.

Image check: `docker build -t bookloop-web:qa --target runner .`, then run it
with the QA database (`host.docker.internal:55432`) on port 3103 and run
`QA_BASE_URL=http://localhost:3103 npx playwright test
--project=chromium-390x844 browse.spec.ts search.spec.ts listing.spec.ts
sell.spec.ts` — 19/19 passed, including the upload path.

---

## 5. Measurements

Final run: **398 passed, 0 failed, 2 flaky** (both passed on the first retry;
LCP under parallel-worker load and one WebKit a11y pass). 8 projects, 12.3
minutes, `artifacts/playwright/results.json`.

| Metric | Baseline (staging) | After (local prod build) |
|---|---|---|
| axe serious/critical on `/` | 59 nodes | 0 nodes — 9 pages × 8 projects |
| Home CLS | 0.217 | 0.018–0.064 |
| Home LCP, Chromium 360→1440 | — | 1.36 / 1.86 / 1.54 / 1.41 s |
| Home LCP, WebKit (parallel run) | — | 3.77–5.35 s (budget 8 s; ~1 s standalone) |
| Search LCP | 2.3 s (staging) | 0.80–2.38 s |
| `/` TTFB (warm) | — | warm `/search` gate < 2 s; observed 0.2–0.5 s |
| Upload: publish → photo served | blocked (missing token) | < 1 s, WebP 6.8 KB from a 1.6 MP JPEG |
| Docker image | — | 324 MB (`bookloop-web:qa`), 19/19 smoke tests on :3103 |

Flakes are harness-timing, not defects: Chromium's first LCP sample at
360×640 hit 4.77 s while three workers decoded the same hero (1.36 s on
retry), and one WebKit a11y navigation crossed the 30 s budget before the
image cache settled. Global setup now warms the public routes so a fresh
build measures the app, not sharp's first pass.

---

## 6. Pre-deploy checklist (InstaCloud)

Deployed 2026-10-31 to `web` and `realtime` on `main`; verified after deploy:
`/`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml` return 200; `/sell`
redirects guests; `POST /api/photos` returns 401 for guests (the route is live on
the DB-backed upload path, no UploadThing token involved) and 403 for foreign
origins; the realtime service serves `/api/health` and its socket.io handshake
echoes only the web origin.

- [x] `BETTER_AUTH_URL` set to the public web URL (canonical/robots/sitemap emit
      it; `NEXT_PUBLIC_APP_URL` is unset on purpose — those readers fall back to
      `BETTER_AUTH_URL`, see `src/app/layout.tsx:28`)
- [x] Realtime CORS allowlist accepts the web origin and rejects a foreign one —
      the CORS allowlist is `BETTER_AUTH_URL` + `APP_ORIGINS`
      (`realtime/server.ts:21`), so both reach the container
- [x] `BETTER_AUTH_SECRET`, `CHAT_JWT_SECRET` unchanged and present
- [x] `NEXT_PUBLIC_REALTIME_URL` present; realtime service answers `/api/health`
      and completes a socket.io polling handshake
- [x] No `UPLOADTHING_TOKEN` required — uploads now run on the DB fallback
- [ ] `photo_blobs` auto-creates on first upload; confirm one real upload after deploy
- [x] `npm run test:qa` green locally (398 tests) and against the Docker image
- [ ] Send a test sign-up + listing + chat from a real phone on mobile data

Two lines stay unchecked because they need a real account on production: an
authenticated upload and a live chat socket. The safety rule for this QA pass
forbids writing test listings to the live Neon branch, so both were proven
locally and in the Docker image (publish → WebP → `/api/photos/<id>`; chat token
→ socket handshake → message echo) instead of against prod. Do them once from a
phone with a real student account, or point the suite at a Neon test branch.
