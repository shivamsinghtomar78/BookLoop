# Phase 0 — Foundation

**Goal:** a deployed, empty-but-alive app: every tool wired, every rule enforced from commit one.
**Demo at the end:** open `bookloop.vercel.app/api/health` → `{ ok: true }` proves app + database are live.
**Depends on:** nothing. **Rough effort:** 2–4 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — and the 🧪 **Test** box can only be ticked when the test actually passed. No test pass → task stays open.

> **Status 13 Sep 2026:** built and verified locally against live Neon (project `red-morning-28332145`, branch `production`; Neon Auth + private `bookloop` bucket + hello function deployed via `neon deploy`; env in `.env.local`). Open items need: a GitHub repo + Vercel connect (Task 0.1/0.7/0.8-prod), and two 1-minute manual checks marked ⏳ below.

---

## Task 0.1 — Scaffold the app
- [x] `npx create-next-app` — TypeScript, App Router, Tailwind, ESLint *(Next 16.3.5, Tailwind v4, src dir, local git initialized)*
- [ ] Push to a GitHub repo; `main` branch protected (PRs only) ⏳ needs your GitHub account
- [ ] 🧪 **Test:** fresh clone → `npm i` → `npm run dev` → default page loads with zero console errors ⏳ after GitHub push

## Task 0.2 — UI system & design tokens
- [x] `shadcn/ui` init; base components added: button, input, card, sheet, dialog, field (form), label, badge, skeleton *(this shadcn version runs on Base UI — buttons use `render`, not `asChild`)*
- [x] `lucide-react` + `sonner` installed (Toaster mounted in root layout)
- [x] Design tokens wired in `src/app/globals.css` (Tailwind v4 CSS vars, not a JS config): primary `#0E9F6E`, warm off-white canvas `#FAF9F5` (D-051), white cards, warmed greys/hairline, radius 8px base + 16px `rounded-2xl`, Inter via `next/font/google`
- [x] No animation library (D-048) — verified: no framer-motion in package.json
- [ ] 🧪 **Test:** open `localhost:3000` on a phone-sized viewport — green button fires a toast, sheet slides up over the dark scrim, text is Inter ⏳ 1-minute manual check (demo rig is on the placeholder home)

## Task 0.3 — Folder structure & shells
- [x] Structure from `ARCHITECTURE.md` §2: `app/api`, `components/`, `services/`, `db/repos/`, `lib/` *( `(auth)`/`(main)` route groups land with their first pages in Phase 1)*
- [x] `lib/zod-schemas.ts` (shell) + `lib/constants.ts` (categories, modes, conditions, exams, classes, D-039 limits, 72h expiry)
- [x] Global `error.tsx` + `not-found.tsx`
- [x] 🧪 **Test:** garbage URL → styled 404 (HTTP 404, friendly page) ✓ · error-page: ⏳ throw-in-a-page check pending (boundary in place)

## Task 0.4 — Database wiring
- [x] Neon project linked (`neon link` → `red-morning-28332145`); `DATABASE_URL` in `.env.local`
- [x] `db/client.ts`: lazy Drizzle via `@neondatabase/serverless` + `drizzle-orm/neon-http` (D-035) — builds don't crash without env
- [x] Scripts: `db:push`, `db:studio`, `db:seed` (drizzle.config + seed load `.env.local` explicitly)
- [x] 🧪 **Test:** `SELECT 1` through Drizzle verified via `/api/health` → `{ok:true, db:true}` ✓

## Task 0.5 — Schema push
- [x] Full schema in `src/db/schema.ts` — 10 tables, 5 enums, indexes, Phase-2 columns (D-029)
- [x] `npm run db:push` — applied to Neon
- [x] 🧪 **Test:** all 10 tables confirmed via information_schema; duplicate `bookloop_id` insert correctly rejected (unique constraint proven) ✓

## Task 0.6 — Seed script
- [x] `db/seed.ts`: 3 users, 11 listings across all categories & modes, 2 photos each, chat with 3 messages, wishlist item, alert
- [x] Idempotent (FK-safe wipe + reinsert) + prod guard (`VERCEL_ENV`/`prod` URL check, `SEED_PROD_OK` override)
- [x] 🧪 **Test:** ran twice → identical counts, no duplicates ✓ *(prod-guard refusal path untested — no prod-like URL exists yet)*

## Task 0.7 — Deploy pipeline
- [ ] Vercel project ← GitHub repo; env vars set in Vercel; `main` → production ⏳ needs GitHub repo first
- [ ] Open a test PR → preview deployment appears
- [ ] 🧪 **Test:** production URL serves the app; the PR preview URL serves the branch version

## Task 0.8 — Health check & env docs
- [x] `GET /api/health` → `SELECT 1` → `{ ok: true, db: true }`, 503 `{ok:false}` on DB failure (graceful, no crash)
- [x] `.env.example` with every var from `TECH.md` §4 *(Neon CLI additionally manages `.env.local` — gitignored)*
- [ ] 🧪 **Test:** `/api/health` returns ok **on production** ⏳ after Vercel · local ok verified ✓

---

## Phase gate — tick to close the phase
- [ ] All 8 tasks above fully ticked
- [ ] Fresh clone + `.env` → running app in under 10 minutes (timed, by the team member who didn't set it up)
- [ ] Production health check green
- [x] Decisions made during this phase logged in `DECISIONS.md` (D-051 warm canvas, D-052 docs/ location)

### To close this phase, the remaining human steps are:
1. Create a GitHub repo and push (`git remote add origin … && git push -u origin main`).
2. Import the repo in Vercel; add `DATABASE_URL` (from `.env.local`) to Vercel env; deploy.
3. Two 1-minute manual checks: the Task 0.2 phone-viewport tap test, and Task 0.1's fresh-clone test.
