# Phase 6 — Polish & Trial Launch

**Goal:** turn a feature-complete app into a launch-ready one, then launch the single-school trial properly.
**Demo at the end:** real students using it — the trial IS the demo.
**Depends on:** Phases 0–5 on production. **Rough effort:** 4–6 days + launch week.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

---

## Task 6.1 — PWA
- [ ] Manifest + icons + theme color; install prompt ("Add BookLoop to your home screen") (D-027)
- [ ] 🧪 **Test:** Android Chrome → install → opens standalone from home screen with icon; Lighthouse PWA checks pass on production

## Task 6.2 — Friction-budget audit
- [ ] Stopwatch/tap-count every WORKFLOW.md §1 budget row on a **cheap Android phone**: class books ≤2 taps, chat start ≤4, listing <2 min, reply ≤2, confirm ≤2
- [ ] Fix every overage before ticking
- [ ] 🧪 **Test:** re-run the full budget table — all rows pass, recorded in this file next to each row

## Task 6.3 — Dead-end audit
- [ ] Force all 8 WORKFLOW.md §9 states (empty search, thin supply, silent seller 48h nudge, reserved-to-others, empty wishlist, no listings, expired reservation, offline draft)
- [ ] 🧪 **Test:** each state shows its promised next action and the action works — checklist of 8, all green

## Task 6.4 — Perceived-speed polish
- [ ] Skeleton loaders on all list screens (never a blank white load); optimistic UI on wishlist/messages/ratings; toast on every action (UX law 6)
- [ ] 🧪 **Test:** throttled slow-3G pass through the whole app — no blank screens, no unexplained waits, no double-submits from impatient tapping

## Task 6.5 — Mobile & copy pass
- [ ] Small-screen layout check (320px width), tap-target sizes, keyboard behavior on forms
- [ ] Every label/empty state/error rewritten in simple English a Class 6 student understands
- [ ] 🧪 **Test:** a younger student (or the most non-technical person available) completes browse→wishlist and list-a-book unaided

## Task 6.6 — Book-drive seeding
- [ ] Bulk-load tooling: spreadsheet of collected books → listings (drive account or per-owner accounts) with photos
- [ ] Seed the real collected books → **100+ live listings** (D-011)
- [ ] 🧪 **Test:** browse as a fresh guest — shelves feel full, filters return real results in every class

## Task 6.7 — Ops readiness
- [ ] Uptime pinger on `/api/health`; alert to team phone/email
- [ ] Neon point-in-time restore drill: restore a branch, verify data (backup proven, not assumed)
- [ ] Vercel rollback drill: revert one deploy, verify prod
- [ ] Free-tier headroom check against ARCHITECTURE.md §6 (invocations especially)
- [ ] 🧪 **Test:** kill a preview deployment's DB URL → pinger alerts within minutes; restore + rollback each completed once, timed

## Task 6.8 — Feedback & metrics
- [ ] In-app "Report a problem" (profile) → simple form → stored/emailed
- [ ] `/admin/stats` (team-only): signups, listings by mode, chats started, transactions closed, books donated — straight from existing tables
- [ ] 🧪 **Test:** submitted report reaches the team; stats page numbers match hand-run SQL on the same day

## Task 6.9 — Launch execution
- [ ] School go-ahead: pickup point confirmed, announcement plan (assembly / notices / class groups)
- [ ] QR posters deep-linking to Home (guests browse instantly — D-041)
- [ ] Launch announcement day + team on-call rota for week one
- [ ] 🧪 **Test (the real one):** first organic transaction — a student the team doesn't know completes list/buy → handover → confirm → rate

---

## Phase gate — tick to close the phase (= trial is live)
- [ ] All 9 tasks fully ticked
- [ ] Uptime green for 7 consecutive days post-launch
- [ ] Weekly metrics reviewed from `/admin/stats` and shared with the school contact
- [ ] Launch-week feature requests logged as Phase 7 candidates in `DECISIONS.md` / PHASE-7 — **not built**
