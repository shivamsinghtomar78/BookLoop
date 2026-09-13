# Phase 1 — Accounts & App Shell

**Goal:** the guest-first app shell plus the full account lifecycle: browse as guest, sign up at intent, confirm email, log in.
**Demo at the end:** logged-out → Home shelves → tap a gated action → signup sheet → confirm email → land back where you were.
**Depends on:** Phase 0. **Rough effort:** 4–6 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

> **Status 13 Sep 2026:** built and headless-tested locally (build green; REST-level auth lifecycle proven: signup → verification link from dev-fallback log → emailVerified=true → landing page → logout → re-login → wrong-password 401; guest route guards 307; test user cleaned up). Remaining: the in-browser manual checks marked ⏳ and the production run (Vercel still unconnected). Better Auth confirmed over provisioned Neon Auth — D-053. Email sending is console-fallback until `RESEND_API_KEY` is set.

---

## Task 1.1 — App shell & guest Home
- [x] Bottom nav (client, mobile-first): Home · Search · Sell ＋ (green circle) · Chats · Profile — active tab in primary green
- [x] Sticky header: BookLoop logo + tagline; Home shelves ("Recently listed", "Free — donations") reading seed listings via `db/repos/listings.ts`; flat `BookCard` (rounded-2xl photo, FREE/EXCHANGE badges, max-5-element layout)
- [x] Guests see everything read-only — `/`, `/search`, `/profile` render with no auth prompt (verified via HTTP: home 200 with shelf content, profile guest state 200)
- [ ] 🧪 **Test:** incognito **phone** browser → Home renders seed books; every nav tab reachable; Chats/Profile show guest states ⏳ manual

## Task 1.2 — Better Auth setup
- [x] Better Auth + Drizzle adapter; `user`/`session`/`account`/`verification` generated via `@better-auth/cli` into `src/db/auth-schema.ts`, pushed to Neon
- [x] `lib/auth.ts` (server config + nextCookies plugin), `lib/auth-client.ts` (useSession), `services/users.ts` (`createProfile`, `getCurrentUser` with lazy email-confirmed sync, `requireUser`)
- [x] Signup server action creates BOTH the Better Auth user and the `users` profile row (linked by `auth_id`)
- [x] 🧪 **Test:** REST signup created BA user + session (verified via get-session) ✓ · profile-row link verified at code level; in-browser signup → check `users` row ⏳ part of Task 1.3 manual

## Task 1.3 — Signup sheet
- [x] Slide-up Sheet: full name, school name, age, class (dropdown 1–12), email, password — Phase-1 fields only, no student ID (D-008)
- [x] `signupSchema`/`loginSchema` in `lib/zod-schemas.ts`, used by react-hook-form AND re-parsed in the server actions (D-036); friendly duplicate-email message
- [x] Inline field errors (react-hook-form + zodResolver, `valueAsNumber` for age/class)
- [ ] 🧪 **Test:** submit invalid data → caught client-side; call the action with bad data → rejected server-side ⏳ manual (the same Zod schema provably gates both — but run it once in the browser)

## Task 1.4 — Email confirmation (Resend)
- [x] `sendVerificationEmail` wired: Resend when `RESEND_API_KEY` set, console fallback in dev; `sendOnSignUp: true`; callback lands on `/email-verified` page
- [x] Verification flips Better Auth `emailVerified`; lazily mirrored to `users.email_confirmed` on session read; resend button on profile
- [x] Unconfirmed users: `requireUser({ confirmedEmail: true })` ready for Phase 2+ write actions (no write actions exist yet to gate)
- [x] 🧪 **Test:** headless full loop ✓ — signup → verification URL from server log → GET link → 302 to `/email-verified` → `emailVerified: true` in session. Real-inbox test ⏳ once `RESEND_API_KEY` is added

## Task 1.5 — Login, logout, route guards
- [x] Login form (sheet) + logout on profile; sessions via Better Auth cookies
- [x] `src/proxy.ts` (Next 16's middleware): `/sell` + `/chats/*` redirect guests to `/` — verified: 307 → `/`
- [x] Wrong password → same friendly message regardless of which field was wrong (server returns 401, action maps to one string)
- [x] 🧪 **Test:** headless ✓ — login ok, wrong password 401, logout ok (CSRF Origin check confirmed working). Back-button-after-logout cache check ⏳ manual

## Task 1.6 — Intent gating & resume
- [x] Guest taps Sell ＋ / Chats → auth sheet opens with intent stored; signup path shows "Check your email" (S3a) then continues; login path continues immediately (`router.refresh` + push intent)
- [x] Profile guest state offers Sign up / Log in with `/profile` intent
- [ ] 🧪 **Test:** as guest, tap Sell → sign up → land on /sell; repeat via login path ⏳ manual (needs a browser)

## Task 1.7 — Profile page
- [x] Authed: name, class + school, "Member since", 👍 count (0), hidden "Verified student" badge slot (shows only when `verified`), confirm-email banner with resend, logout
- [x] Tabs as empty states with next-action hints (My Listings / My Chats / My Wishlist per WORKFLOW.md §9)
- [ ] 🧪 **Test:** fresh account shows correct data; empty tabs show next-action states ⏳ manual

---

## Phase gate — tick to close the phase
- [ ] All 7 tasks fully ticked (manual ⏳ checks done)
- [ ] Full journey on **production**: guest browse → gated tap → signup → email confirm → resume action → logout → login ⏳ needs Vercel (add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=<prod URL>`, `RESEND_API_KEY` to Vercel env)
- [ ] Second team member repeats the journey on their own phone without instructions
- [x] Decisions made this phase logged in `DECISIONS.md` (D-053)
