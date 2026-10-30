# QA log — 2026-10-29/30

Working notes for the end-to-end QA pass. Facts only: what was checked, what
was found, what changed, and how it was verified.

## Environment

| Item | Value |
|---|---|
| App under test | local production build (`next build` + `next start -p 3102`) |
| Database | disposable local Postgres 16 container `bookloop-qa-pg` (`:55432/bookloop_qa`), seeded with `npm run db:test:seed` |
| Production DB | **not touched** — no Neon credentials were used for writes |
| Browsers | Chromium + WebKit (Playwright 1.63), viewports 360×640 / 390×844 / 768×1024 / 1440×900 |
| Staging baseline | InstaCloud URL captured read-only (`artifacts/baseline`) |

## Timeline

1. **Recon + baseline.** Mapped every route/action/table to `docs/QA-APP-MAP.md`.
   Read-only crawl of staging at 4 viewports × 11 pages: 59 contrast nodes,
   CLS spikes to 0.217, /privacy and /terms returned 404.
2. **Blocking bug: photo uploads on production.** `/sell` showed
   "Missing token. Please set the `UPLOADTHING_TOKEN`…" — the token was never
   configured. Added a zero-config fallback: browser-side downscale →
   `POST /api/photos` → sharp → WebP → Postgres → `GET /api/photos/<uuid>`
   with immutable caching. UploadThing stays in place when a token exists.
   Verified in a real browser (publish + serve + detail render).
3. **Database portability.** `db.batch` only exists on the Neon HTTP driver;
   local/CI Postgres broke all multi-write flows. Introduced
   `atomically()` (`src/db/atomic.ts`) and converted 6 call sites.
4. **Contrast pass.** Token-level fixes (not page patches): muted, primary,
   free, destructive, ring. Footer used 80% opacity — removed.
   59 → 3 → 0 serious axe violations on `/`.
5. **Harness.** `playwright.config.ts` + 9 specs + global setup/teardown,
   `npm run test:qa`. Added a hydration marker so click tests can't race React.
6. **Security.** Trusted origins, per-IP auth rate limits (NAT-aware),
   HTTPS-only secure cookies, HSTS, COOP, report-only CSP, realtime CORS from
   `APP_ORIGINS`, production guard on missing `BETTER_AUTH_URL`.
7. **Trust pages.** `/privacy` and `/terms` written in plain language,
   linked from the footer, in the sitemap; 404s removed.
8. **SEO.** metadataBase + OG/Twitter cards, `opengraph-image`, `robots.txt`
   that keeps school-only surfaces out of search, `sitemap.xml`.
9. **Soft 404s.** Missing listings and non-admins on `/admin/stats` returned
   HTTP 200 with a 404 body (streaming). Gates moved into `generateMetadata`.
10. **CLS.** Home measured 0.217: the footer sat at y=673 in the streaming
    shell and then jumped off-screen. Reserved the first viewport
    (`min-h-[calc(100svh-…)]`) and matched the header skeleton to the settled
    auth cluster.
11. **A11y details.** `role="alert"` on form errors, `role="log"` +
    `aria-live` on chat messages, `global-error.tsx` for root failures.
12. **Dependencies.** `npm audit --omit=dev` reported 3 critical (Next.js
    `next/og` RCE, better-auth rate-limit bypass on Postgres, proxy-addr IP
    spoofing via the UploadThing → express chain). Upgraded next 16.3.5 →
    16.4.3, better-auth 1.7.4 → 1.7.14, zod 4.6.4 → 4.6.7, sharp 0.35.4 →
    0.35.5, and overrode proxy-addr to ^2.0.8. Criticals: 3 → 0. The remaining
    highs sit in the optional UploadThing/express path, shadcn (dev tool) and
    unused MCP SDK — tracked, no fix released yet.
13. **UI polish.** Search chip rows fade at the right edge on phones instead of
    clipping mid-word; results now say "N books" with a Clear all link; listing
    pages show a Details grid (class, subject, condition, edition, listed); the
    dark-header tagline went from white/40 to white/60 (the last serious axe
    node, 1440 home).

14. **Session invalidation after the auth upgrade.** Cookies signed by
    better-auth 1.7.4 stopped resolving on 1.7.14 — the safety fix changed
    token signing. Real students will be signed out once on the first deploy
    that includes this bump; nothing else is affected. The QA harness now
    verifies a cached storage state with `get-session` (not just its mtime) and
    re-logs in when the cookie is dead.
15. **Origin is enforced on auth POSTs.** 1.7.14 rejects sign-in without an
    `Origin` header (403 `MISSING_OR_NULL_ORIGIN`) — correct CSRF behaviour;
    the API-based test helpers now send one. The log-out spec also signs in
    inside its own test so revoking that session cannot break other specs.
16. **Sell form readiness.** WebKit occasionally typed into the sell form after
    the shell hydration marker but before React Hook Form hydrated; the fills
    were reverted and publish failed with "Give the book a title". The form now
    sets `data-ready="1"` once its draft-resume effect has run, and
    `sell.spec.ts` waits for it before typing.
17. **Photo quota vs. repeated runs.** `/api/photos` allows 40 uploads per user
    per day. Eight sell specs (plus retries) across projects, run repeatedly,
    exhausted the seeded seller's quota, so the last WebKit projects saw 429s
    and no thumbnail. The ceiling is now `PHOTO_DAILY_LIMIT` (default 40) and
    the QA stack raises it; teardown also deletes blobs referenced by QA
    listings. This was a test-environment limit, not a student-facing bug.
18. **Cold image cache on fresh builds.** A rebuilt app has an empty Next image
    cache, so the first Chromium project paid sharp re-encoding for every hero
    image and missed 30 s navigation budgets. Global setup now warms the public
    routes before workers start.
19. **Platform-rewritten Host broke uploads in production.** After deploying
    the upload fix, `POST /api/photos` with the public `Origin` returned
    `403 Forbidden`: InstaCloud terminates TLS and rewrites the `Host` header,
    so `Origin.host === req.headers.host` was never true. The guard now also
    accepts `x-forwarded-host`, `BETTER_AUTH_URL`, and `APP_ORIGINS`.
    Verified after redeploy: guest → 401 ("Sign in to add photos"), foreign
    origin → 403. This would have made the original upload bug look fixed in
    code review while still failing for every real student.
20. **Production env checked by name, not assumed.** `insta secrets list`
    shows project-wide `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`,
    `CHAT_JWT_SECRET`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
    `NEXT_PUBLIC_REALTIME_URL` — and no `NEXT_PUBLIC_APP_URL`. That is fine:
    `layout.tsx`, `robots.ts` and `sitemap.ts` fall back to `BETTER_AUTH_URL`,
    and the deployed HTML emits the public URL with zero `localhost` refs.
    Realtime CORS echoes the web origin and sends no ACAO header to a foreign
    origin, which proves `BETTER_AUTH_URL` reaches that container too. The
    earlier checklist entry claiming `NEXT_PUBLIC_APP_URL` was set is corrected
    rather than silently left as a false green tick.

## Known, deliberately deferred

- Password reset needs an email provider (testing mode D-059 has none).
- School-ID roster approval exists for one seeded user but has no admin UI.
- Search caps at 60 results (no pagination) — fine at pilot volume.
- Rate limits are in-memory and per-instance; move to shared storage when the
  app runs more than one instance.
