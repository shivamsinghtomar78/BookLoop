# Phase 6 — Polish & Trial Launch

**Goal:** turn a feature-complete app into a launch-ready one, then launch the single-school trial properly.
**Demo at the end:** real students using it — the trial IS the demo.
**Depends on:** Phases 0–5 on production. **Rough effort:** 4–6 days + launch week.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

> **Status 14 Sep 2026:** all buildable items built and verified locally (PWA manifest + original icon set, skeleton loaders on every list screen, silent-seller nudge, install banner, feedback channel + team-gated /admin/stats, book-drive CSV import w/ dry-run). **The launch half of this phase is blocked on three external things:** (1) Vercel env vars + stable domain (deploy exists but errored on missing env — see chat 14 Sep), (2) `UPLOADTHING_TOKEN` + `RESEND_API_KEY`, (3) the school (pickup point, drive books, announcement). Those are the ⏳ items below.

---

## Task 6.1 — PWA
- [x] `app/manifest.ts` (name, standalone, loop-green theme, warm canvas bg) + original icon set generated from an in-repo SVG mark (`scripts/make-icons.ts` → 192/512/maskable/apple-touch) + `themeColor` viewport
- [x] Install banner on Home: `beforeinstallprompt` capture, "Add to your home screen", dismiss remembered per device
- [x] 🧪 **Test:** manifest served with icons ✓, icons 200 image/png ✓, theme-color in HTML ✓; Lighthouse installability + real Android install ⏳ needs the production URL

## Task 6.2 — Friction-budget audit
- [x] Automated halves already proven: class books ≤2 taps & chat start ≤4 (Phase 3 browser tests), sell-form flow (Phase 2), 44px targets (responsive sweep)
- [ ] 🧪 **Test:** stopwatch/tap table re-run on a **cheap Android phone against production** ⏳ needs Vercel + a phone

## Task 6.3 — Dead-end audit
- [x] All 8 WORKFLOW §9 states now exist — including the previously-missing **silent-seller 48h nudge** in chat ("Seller's been quiet — see similar books") built this phase; empty search/alert CTA, reserved→see-similar, empty wishlist trending, empty listings, expired reservation, draft resume, seeded supply
- [ ] 🧪 **Test:** force each state on production and tick the 8-row checklist ⏳ (5 already proven in Phases 2–4 tests; nudge + 2 others need a staged walkthrough)

## Task 6.4 — Perceived-speed polish
- [x] `loading.tsx` skeletons for Home, search, chats, listing detail, profile — no blank screens anywhere; optimistic UI already live (wishlist/messages/ratings); toast on every action
- [ ] 🧪 **Test:** slow-3G full-app pass ⏳ manual (throttled devtools or real network)

## Task 6.5 — Mobile & copy pass
- [x] 320px layouts verified in the responsive sweep (D-054); tap targets ≥44px; copy already written plain ("Say hi — no phone numbers needed", "Slow down a little 🙂")
- [ ] 🧪 **Test:** an actual younger student completes browse→wishlist and list-a-book unaided ⏳ needs a human

## Task 6.6 — Book-drive seeding
- [x] `scripts/book-drive-import.ts`: CSV → live listings under a "BookLoop Drive" account (Zod-validated per row, `--dry-run` mode, skips the 20-listing cap via explicit `skipLimit` — D-057); template at `docs/book-drive-template.csv`
- [x] 🧪 **Test:** dry run on the template → 5/5 rows valid ✓; real import of 100+ drive books ⏳ needs the actual collected books
- [ ] Seed the real book-drive listings before launch day ⏳ school

## Task 6.7 — Ops readiness
- [ ] Uptime pinger on `/api/health` ⏳ needs the production URL (UptimeRobot/cron-job.org free — 5-min setup)
- [ ] Neon point-in-time restore drill ⏳ (create a branch from a past timestamp in the Neon console, verify data)
- [ ] Vercel rollback drill ⏳ needs working Vercel deploy
- [x] Free-tier headroom: socket.io realtime removed most chat polling; remaining polling (fallback + 30s badge) is within the ARCHITECTURE §6 table
- [ ] 🧪 **Test:** pinger alert fires; restore + rollback each done once ⏳

## Task 6.8 — Feedback & metrics
- [x] "Report a problem" on profile → `feedback` table (guests supported; page recorded; optional `TEAM_INBOX_EMAIL` heads-up email)
- [x] `/admin/stats`: signups, confirmed users, listings by mode, chats, messages, deals completed, donations, 👍 — plus latest 20 problem reports; gated by `ADMIN_EMAILS` env (non-admins get the 404 page)
- [x] 🧪 **Test:** guest request to /admin/stats renders 404 content with zero metrics ✓; add your email to `ADMIN_EMAILS` (local `.env` + Vercel) and verify numbers against SQL ⏳ 2-min check

## Task 6.9 — Launch execution
- [ ] School go-ahead: pickup point confirmed, announcement plan ⏳ school conversation
- [ ] QR posters deep-linking to the production Home ⏳ (I can generate the poster QR once the domain is final)
- [ ] Launch week on-call rota ⏳ team
- [ ] 🧪 **Test (the real one):** first organic transaction by a student the team doesn't know ⏳

---

## Phase gate — tick to close the phase (= trial is live)
- [ ] All 9 tasks fully ticked
- [ ] Uptime green for 7 consecutive days post-launch
- [ ] Weekly metrics reviewed from `/admin/stats` and shared with the school contact
- [x] Decisions logged (D-057); launch-week feature requests go to PHASE-7, not the codebase

### The launch-blocking checklist (everything left, in order)
1. **Vercel env vars** (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`=stable domain, `CHAT_JWT_SECRET`, `ADMIN_EMAILS`) → redeploy → I verify prod health + run the prod smoke suite.
2. **Keys:** `UPLOADTHING_TOKEN` (photo uploads — blocks real listings!), `RESEND_API_KEY` (real emails).
3. Optional now / needed for instant chat: host `realtime/server.ts` (Render free) + set `NEXT_PUBLIC_REALTIME_URL`.
4. School: pickup point, book drive (CSV → import script), announcement date.
5. Manual audits: phone friction pass, slow-3G pass, dead-end walkthrough, PITR + rollback drills, uptime pinger.
