# Phase 1 — Accounts & App Shell

**Goal:** the guest-first app shell plus the full account lifecycle: browse as guest, sign up at intent, confirm email, log in.
**Demo at the end:** logged-out → Home shelves → tap a gated action → signup sheet → confirm email → land back where you were.
**Depends on:** Phase 0. **Rough effort:** 4–6 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

---

## Task 1.1 — App shell & guest Home
- [ ] Bottom nav: Home · Search · Sell ＋ · Chats · Profile (mobile-first)
- [ ] Home: header with tagline + "For students of [School]" (D-041 moved it here), placeholder shelves reading seed listings
- [ ] Guests see everything read-only — no login redirect anywhere on read surfaces
- [ ] 🧪 **Test:** incognito phone browser → Home renders seed books; every nav tab reachable without any auth prompt (Chats/Profile show guest states)

## Task 1.2 — Better Auth setup
- [ ] Better Auth + Drizzle adapter; its `user`/`session`/`verification` tables pushed
- [ ] `lib/auth.ts` helpers: `getSession()`, `requireUser()` (returns our `users` profile row via `auth_id`)
- [ ] Signup handler creates BOTH the Better Auth user and our `users` profile row in one flow
- [ ] 🧪 **Test:** programmatic signup → rows exist in Better Auth tables AND `users` with matching `auth_id`; `getSession()` returns the profile

## Task 1.3 — Signup sheet
- [ ] Slide-up Sheet: full name, school name, age, class (dropdown 1–12), email, password (min 8) — Phase-1 fields only, no student ID (D-008)
- [ ] Zod schema in `lib/zod-schemas.ts`, used by react-hook-form AND re-parsed server-side (D-036)
- [ ] Inline field errors; duplicate email → friendly message
- [ ] 🧪 **Test:** submit invalid data (age "abc", 4-char password, bad email) → caught client-side; bypass the form and call the action directly with the same bad data → rejected server-side too

## Task 1.4 — Email confirmation (Resend)
- [ ] Resend wired; confirmation email with link on signup; "Check your email" state (S3a)
- [ ] Clicking link sets `users.email_confirmed = true`; expired/reused token → friendly retry screen
- [ ] Unconfirmed users: browse OK; list/chat/wishlist actions blocked **in services** with "confirm your email" response
- [ ] 🧪 **Test:** real signup with a real inbox → email arrives, link confirms, DB flag flips; before confirming, call a write action directly → blocked server-side

## Task 1.5 — Login, logout, route guards
- [ ] Login sheet/page (email + password), logout in Profile
- [ ] `middleware.ts`: session loaded; authed-only routes (chats, profile settings) redirect guests appropriately
- [ ] Wrong password → friendly error, no info leak (same message for wrong email vs wrong password)
- [ ] 🧪 **Test:** login works; logout kills the session (back button shows guest state, not cached private data); direct URL to a chat while logged out → redirected

## Task 1.6 — Intent gating & resume
- [ ] Guest taps Chat / List / Wishlist → signup sheet opens with the intended action stored
- [ ] After signup OR login, the user lands exactly where they were with the action continued (WORKFLOW.md §2)
- [ ] 🧪 **Test:** as guest, tap wishlist heart on a specific book → sign up → heart is filled on THAT book; repeat via login path; repeat for the Sell tab

## Task 1.7 — Profile page
- [ ] Name, class, "Member since", 👍 count placeholder, hidden "Verified student" badge slot
- [ ] Tabs (empty states for now): My Listings, My Chats, My Wishlist
- [ ] 🧪 **Test:** profile shows correct data for a fresh account; empty tabs show their WORKFLOW.md §9 next-action states, not blank screens

---

## Phase gate — tick to close the phase
- [ ] All 7 tasks fully ticked
- [ ] Full journey on **production**: guest browse → gated tap → signup → email confirm → resume action → logout → login
- [ ] Second team member repeats the journey on their own phone without instructions
- [ ] Decisions made this phase logged in `DECISIONS.md`
