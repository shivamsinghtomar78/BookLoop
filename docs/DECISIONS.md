# BookLoop — Decision Log

Every decision made during development goes in this file — big or small, product or technical.
**Rule: if we chose between options, it gets an entry.** Newest entries go at the bottom of the log.

**How to add an entry:**

```
### D-0XX — Short title
- **Date:** YYYY-MM-DD
- **Area:** Product | Tech | Design | Business | Process
- **Decision:** what we chose
- **Why:** the reason, in one or two lines
- **Instead of:** what we rejected (if anything)
- **Status:** ✅ Active | 🔄 Superseded by D-0YY | ❌ Reversed
```

---

## Log

### D-001 — Four modes on one platform
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** BookLoop supports Buy, Sell, Exchange and Donate as equal first-class modes.
- **Why:** Different students have different motivations; one platform covering all four keeps the whole book flow in one place.
- **Status:** ✅ Active

### D-002 — Every listing gets a BookLoop ID + QR code
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Unique short ID (format `BL-0042`) and a QR code per listing.
- **Why:** Makes books trackable/shareable now and enables "book history" (scan → see the book's journey) later.
- **Status:** ✅ Active

### D-003 — All book types, not just textbooks
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Four categories with category-specific filters: Textbooks (class+subject), Reference/Guide (class+subject), Competitive exam (exam+subject: JEE/NEET/Olympiad/other), Novels & other (genre/author).
- **Why:** Students buy far more than textbooks; category-aware filters keep search useful for each type.
- **Status:** ✅ Active

### D-004 — In-app chat only, no contact details exposed
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Buyer–seller contact happens exclusively through in-app chat; phone numbers and emails are never shown.
- **Why:** Users are school students — exposing personal contact info is a real safety issue.
- **Instead of:** Showing seller phone/email on the listing.
- **Status:** ✅ Active

### D-005 — Handover at a designated school pickup point
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Book handovers happen at the school library/office, not private meetups. Pinned as a system message in every chat.
- **Why:** Safety; also keeps the school visibly involved in the loop.
- **Status:** ✅ Active

### D-006 — Fixed 4-tier condition standard
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Condition is one of: Like New · Good · Fair · Worn, with at least one photo required; free-text note is optional extra.
- **Why:** Vague condition descriptions cause "you said good, this is torn" disputes.
- **Instead of:** Free-text condition field.
- **Status:** ✅ Active

### D-007 — 👍/👎 rating after each completed transaction
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** One-tap optional thumbs rating from both sides after buyer confirms handover.
- **Why:** Builds seller accountability with near-zero friction; full star-ratings/reviews deferred.
- **Instead of:** Full ratings & reviews system in the prototype.
- **Status:** ✅ Active

### D-008 — Verification is phased: none at first, roster match at full launch
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** **Phase 1 (initial submission):** no identity verification — signup collects full name, school name, age, class, email (confirmation link), password; login is email + password. **Phase 2 (full launch):** student enters 11-digit Student ID + name, matched against the school-provided roster; one account per ID; "Verified student" badge.
- **Why:** Zero signup friction for the prototype; the school already holds all student data, so verification plugs in cleanly later.
- **Instead of:** (a) ID-card photo upload — rejected: sensitive images on our servers, manual review doesn't scale; (b) collecting the Student ID unverified at signup — superseded by this cleaner phasing.
- **Status:** ✅ Active

### D-009 — Never store ID-card photos
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Verification is number + roster match only; no ID images are ever uploaded or stored.
- **Why:** An ID card image (name, DOB, photo, roll number) is a breach liability, not an asset.
- **Status:** ✅ Active

### D-010 — Free for students; monetize schools
- **Date:** 2026-09-13
- **Area:** Business
- **Decision:** No per-transaction platform fee. Primary revenue = school subscriptions (sustainability dashboard, CSR reporting, verified-student integration). Featured listings only after multi-school scale.
- **Why:** A fee on ₹50–200 transactions punishes the exact behaviour we want; featured listings are pointless in a small single-school pool.
- **Instead of:** Original idea of a small platform fee per successful transaction + featured listings from day one.
- **Status:** ✅ Active

### D-011 — Single-school pilot, seeded by a book collection drive
- **Date:** 2026-09-13
- **Area:** Business
- **Decision:** Launch at one school; run a collection drive with the school so 100+ listings exist before buyers arrive; expand school by school using pilot impact numbers.
- **Why:** Closed community solves trust for free; a marketplace must never feel empty on day one (cold-start problem).
- **Status:** ✅ Active

### D-012 — Prototype scope: ~12 screens with named upgrade slots
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** Prototype covers signup, browse/filter, listing (all modes), chat, mark-sold flow, wishlist, profile. Deferred with visible slots: payments, push notifications, exchange matching algorithm, full reviews, QR scan-to-open, sustainability dashboard.
- **Why:** Small enough to build and demo; every deferred feature has a place it upgrades into. (Full detail: `SCREEN_FLOW.md` §3.)
- **Status:** ✅ Active

### D-013 — Docs kept consistent: SCREEN_FLOW.md updated with verification phasing
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** When the phased-verification decision (D-008) changed the signup fields, `SCREEN_FLOW.md` was updated in the same change rather than left contradicting `PROBLEM_STATEMENT.md`.
- **Why:** Two docs disagreeing about the same screen is worse than either being wrong.
- **Status:** ✅ Active

### D-014 — Framework: Next.js (App Router) + TypeScript
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** One Next.js project is both frontend and backend (server actions / route handlers).
- **Why:** No separate API server to build/deploy; TypeScript catches bugs early for a small team moving fast; free Vercel hosting.
- **Instead of:** Separate frontend + Express/Node backend.
- **Status:** ✅ Active

### D-015 — One UI system: Tailwind + shadcn/ui only
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** shadcn/ui is the single component system; extras limited to `lucide-react` (icons) and `sonner` (toasts). Anything missing → one Radix primitive, not a second library.
- **Why:** Mixing UI libraries (MUI + shadcn + Ant…) gives inconsistent look and bloated bundles.
- **Instead of:** "shadcn + other more UI libraries" (original suggestion).
- **Status:** ✅ Active

### D-016 — Database: Neon Postgres
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Serverless Postgres on Neon.
- **Why:** BookLoop's data is naturally relational; real free tier; DB branching gives free test copies.
- **Status:** ✅ Active

### D-017 — ORM: Drizzle (over Prisma)
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Drizzle ORM + drizzle-kit for schema, queries and migrations.
- **Why:** Chosen explicitly for speed — near-raw-SQL performance and tiny bundle → faster serverless cold starts; officially documented pairing with Neon. Trade-off accepted: Prisma is more beginner-friendly with nicer tooling.
- **Instead of:** Prisma.
- **Status:** ✅ Active

### D-018 — Never switch ORM mid-project
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** The Drizzle choice is final for the prototype; no mid-build migration to Prisma regardless of friction.
- **Why:** A mid-project ORM migration is pure wasted time; both tools can ship BookLoop.
- **Status:** ✅ Active

### D-019 — Auth: Better Auth (email + password)
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Better Auth handles signup, login, sessions and email-confirmation links; users live in our own Neon DB.
- **Why:** Phase 1 needs only credentials auth — no paid service needed; owning the user table keeps the Phase 2 `verified` flag simple.
- **Instead of:** Clerk / Auth0 (paid at scale, overkill for pilot).
- **Status:** ✅ Active

### D-020 — Email delivery: Resend
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Resend sends confirmation links and notify-me alert emails.
- **Why:** Free tier (100/day) covers a pilot; pairs with React Email templates.
- **Status:** ✅ Active

### D-021 — Book photos: UploadThing, URLs in Postgres
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Photos (1–4 per listing) are stored in UploadThing; the database stores only URLs.
- **Why:** Images in a database are an anti-pattern; UploadThing is the lowest-friction Next.js-native option. Cloudinary is the named upgrade for auto-compression.
- **Status:** ✅ Active

### D-022 — Chat: Postgres polling, no WebSockets in prototype
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Messages live in a `messages` table; the chat screen refetches every few seconds. Upgrade slot: Pusher/Ably.
- **Why:** Real-time infra is the most expensive thing to build and least needed at 50–200 users; polling is invisible-fast at this scale.
- **Instead of:** WebSockets / managed real-time service from day one.
- **Status:** ✅ Active

### D-023 — Search: Postgres `ILIKE` + filter columns
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Title search via `ILIKE`, filters via indexed columns. Upgrade slots: Postgres full-text → Meilisearch/Algolia at multi-school scale.
- **Why:** Enough at one-school scale; zero extra infrastructure.
- **Instead of:** Dedicated search engine from day one.
- **Status:** ✅ Active

### D-024 — Forms & validation: react-hook-form + Zod (client and server)
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** All forms use react-hook-form with Zod schemas; the same Zod schemas re-validate on the server.
- **Why:** The listing form has category-dependent conditional fields — shadcn's form components are built around this pair; one schema, two enforcement points.
- **Status:** ✅ Active

### D-025 — QR generation: `qrcode` npm package
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** QR codes generated in-app with the `qrcode` library.
- **Why:** One function call; no external service needed.
- **Status:** ✅ Active

### D-026 — Hosting: Vercel free tier
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Deploy on Vercel.
- **Why:** Zero-config for Next.js, free SSL, preview deploys per branch; whole pilot stack runs at ₹0/month.
- **Status:** ✅ Active

### D-027 — Mobile-first PWA, no native app in prototype
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Design mobile-first; add a PWA manifest so students can install BookLoop to their home screen. React Native/Expo is a post-pilot decision.
- **Why:** Students live on phones, but building two frontends now doubles the work for no pilot value.
- **Instead of:** Native app from day one.
- **Status:** ✅ Active

### D-028 — One `listings` table for all four modes
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Sell, Exchange and Donate share a single `listings` table distinguished by a `mode` column (`price_inr` NULL unless sell; `wants_book` only for exchange).
- **Why:** The modes share ~90% of fields and one search screen; separate tables would triple every query.
- **Instead of:** Separate tables per mode.
- **Status:** ✅ Active

### D-029 — Phase 2 columns built into the schema from day one
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** `users.student_id` (unique, nullable) and `users.verified` (default false) exist in the prototype schema but stay empty until full launch.
- **Why:** Full-launch verification then needs zero migration — just an update query after roster match; the unique constraint enforces one account per ID automatically.
- **Status:** ✅ Active

### D-030 — No payments in the prototype
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Money changes hands in person (cash / free) at the pickup point; no payment gateway integration.
- **Why:** Students pay no platform fee anyway (D-010), and payment infra is heavy; nothing in the pilot needs it.
- **Status:** ✅ Active

### D-031 — Exchange matching is a filtered list in the prototype
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** Exchange = browsable HAS ⇄ WANTS offers. "Possible matches for you" is a stretch goal; a real matching engine and multi-way chains are post-pilot.
- **Why:** True matching is a graph/stable-matching problem — a strong differentiator worth building properly later, not hand-waving now.
- **Status:** ✅ Active

### D-032 — Every decision gets logged here
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** All future decisions — big or small — are added to this file using the template above, at the time they're made.
- **Why:** Six months from now, "why did we do it this way?" should have an answer that isn't "nobody remembers."
- **Status:** ✅ Active

### D-033 — Modular monolith: one Next.js app is the whole system
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** No microservices, no separate API server, no queue, no Redis, no cron infra. Neon Postgres is the only stateful component; everything else is a stateless Vercel function.
- **Why:** Vercel functions are stateless/short-lived — designs needing in-memory state fight the platform. Pilot risk is bugs and slow iteration, not load. Scaling later is swap-per-seam (see D-040).
- **Instead of:** Microservices / separate backend / adding Redis or a queue from day one.
- **Status:** ✅ Active

### D-034 — Strict internal layers: UI → Actions → Services → Repos → DB
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** One-direction dependencies. All business rules live in `src/services/`; Drizzle queries only in `src/db/repos/`; actions are thin (auth → Zod → one service call → revalidate). Authorization checks live in services, never only in UI.
- **Why:** The service layer is the unit-testable core and the seam where every post-pilot upgrade lands without touching UI or repos.
- **Status:** ✅ Active

### D-035 — Neon serverless HTTP driver (no connection pool)
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** `@neondatabase/serverless` + `drizzle-orm/neon-http`; each query is a stateless HTTP call; explicit transactions for multi-statement writes.
- **Why:** Serverless functions can't hold classic pools — HTTP queries make connection exhaustion structurally impossible at any instance count.
- **Instead of:** node-postgres pool / PgBouncer setup.
- **Status:** ✅ Active

### D-036 — Reads via RSC, writes via a fixed server-action pipeline
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Pages are React Server Components calling services directly (cache-tagged, revalidated on write). Every mutation: session check → server-side Zod parse → service → revalidate → typed `{ok}|{error}` result. Zod schemas shared client/server from one file.
- **Why:** No client-side data-fetching layer to build; fast on cheap phones; one validation source of truth with the server as the real gate.
- **Status:** ✅ Active

### D-037 — Chat polling engineered for cost: incremental, visibility-gated, backoff
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Poll returns only messages after the last seen id; 4s interval only while the chat screen is visible; backoff to 15s when idle; stop in background tabs. Badge count polled at 30s on the app shell.
- **Why:** Chat polling is the dominant consumer of the only scarce free-tier resource (Vercel invocations) — this design keeps the trial inside the free tier (ARCHITECTURE.md §6).
- **Instead of:** Naive fixed-interval full-refetch polling.
- **Status:** ✅ Active

### D-038 — Alert matching runs synchronously on publish; email is best-effort
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** New-listing → `book_alerts` matching happens inline in the publish action (one indexed query); in-app `notifications` row is the source of truth; Resend email never blocks or fails the publish.
- **Why:** Milliseconds at one-school scale — a queue is complexity without benefit now; the seam exists for Inngest/Cron later.
- **Instead of:** Background job queue from day one.
- **Status:** ✅ Active

### D-039 — Guarded state machine for listing status; DB-count rate limits
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** `active → reserved → closed` transitions only via the transactions service (seller marks, buyer confirms; UNIQUE `transactions.listing_id` prevents double-close even under races). Abuse caps via plain DB counts (20 active listings/user, 10 new chats/day, 1 msg/sec) — no Redis, per the Vercel+Neon-only constraint.
- **Why:** Trust flow correctness must be server-enforced; DB counts are enough at pilot scale (Upstash is the named upgrade slot).
- **Status:** ✅ Active

### D-040 — Environments: Neon branching as free staging; scale-out is swap-per-seam
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** Local dev + Vercel preview deploys wired to Neon branches (copy-on-write staging); prod data never the test bed. Post-trial upgrades are named per seam (polling→Pusher, sync matching→Inngest, ILIKE→full-text, DB limits→Upstash, +`school_id` for multi-school) — no rewrite planned or needed.
- **Why:** Free, real-data staging with zero extra services; drawing the seams now is what makes the monolith safe to scale later.
- **Status:** ✅ Active

### D-041 — Guest browsing: browse first, sign up at the moment of intent
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** The app opens directly into Home with full search/browse for everyone. Signup appears as a slide-up sheet only when the user taps Chat, List, or Wishlist — and returns them exactly where they were. No welcome wall.
- **Why:** The Amazon/Myntra pattern — first impression is full shelves, not a login form; signup at the moment of intent converts far better than signup at the door.
- **Instead of:** Original SCREEN_FLOW welcome screen gating everything behind login (SCREEN_FLOW.md updated to match).
- **Status:** ✅ Active

### D-042 — Two-minute, photo-first listing form with smart defaults
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** Sell flow opens the camera first; class pre-filled from profile; category-conditional fields only; condition = 4 picture cards; typical-price nudge; Sell/Exchange/Donate as one toggle; publish screen has a WhatsApp-ready Share card.
- **Why:** The seller form is BookLoop's checkout — every removed second adds supply; the price nudge removes the "what do I ask?" freeze; share cards make sellers the marketing channel.
- **Status:** ✅ Active

### D-043 — Reservations auto-expire after 72 hours (lazy check, no cron)
- **Date:** 2026-09-13
- **Area:** Product
- **Decision:** A listing stuck in `reserved` with no buyer confirmation for 72h reverts to `active` on next read; both parties are notified. Implemented as a lazy check in the read path — no cron job, per the no-extra-infra architecture.
- **Why:** Prevents zombie reservations from silting up the marketplace when someone stops replying; lazy evaluation keeps the Vercel+Neon-only constraint.
- **Instead of:** Manual un-reserving only, or a scheduled job.
- **Status:** ✅ Active

### D-044 — Order-tracking UX: status stepper + quick-ask chat chips
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** Every chat shows a Myntra-style stepper (Chatting → Reserved → Meet at pickup → Done → Rate) both sides see identically; new chats open with one-tap quick-ask chips ("Is this available?", "Can we meet tomorrow?", "Will you take ₹__?"); notifications deep-link to the exact screen.
- **Why:** Always-visible status is rule #5 of marketplace smoothness; quick-ask chips remove blank-message anxiety for shy students (OLX/Meesho pattern).
- **Status:** ✅ Active

### D-045 — Development split into 8 phases (docs/phases/), demoable slices, supply first
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** Build order: Phase 0 Foundation → 1 Accounts & Shell → 2 Sell → 3 Buy → 4 Chat & Transactions → 5 Exchange & Donate → 6 Polish & Trial Launch; Phase 7 (post-pilot tracks) starts only on triggers observed in pilot data. Rules: every phase ends demoable on the deployed app, Sell is built before Buy (supply before demand, mirroring D-011), phases only depend backward, and each phase's Definition of Done must pass on production — not just locally. One file per phase in `docs/phases/`.
- **Why:** Demoable slices keep momentum and force end-to-end wiring early; hardest phase (chat/transactions) lands when all its prerequisites exist; scope discipline gets a physical home (out-of-scope items move to a later phase file instead of being built).
- **Instead of:** Layer-by-layer building (all backend, then all UI) — nothing demoable until the end; or feature-parallel work with shared-file conflicts for a small team.
- **Status:** ✅ Active

### D-046 — Phases divided into test-gated checkbox tasks
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** Every phase file is divided into numbered tasks (Task N.1, N.2 …). Each task = build checkboxes + exactly one 🧪 Test checkbox with a concrete pass condition (on production / on a phone / via direct API call). A task counts as complete only when its test has actually passed; each phase closes with a Phase-gate checklist verified on the deployed app. Phase 7 tracks get task breakdowns only when activated by pilot evidence.
- **Why:** "Done" without a passed test is the main way student projects accumulate invisible breakage; the tick rule makes testing non-skippable and progress honestly visible in git history.
- **Instead of:** Plain scope lists without per-task test conditions (previous phase-file format).
- **Status:** ✅ Active

### D-047 — UI language adapted from Airbnb DLS: one accent (loop green), Inter, photo-led flat cards
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** BookLoop adopts the Airbnb DLS *method* (documented in `UI_REFERENCE.md`): single accent color `#0E9F6E` used for exactly one primary action per screen; orange `#E8590C` reserved for FREE/donation badges only; neutral ink/grey scale for everything else; Inter as the only typeface with weight-only hierarchy; 4px spacing grid; radius 8px (controls) / 16px (cards, photos) / pill (search); book cards flat — no border, no shadow, rounded photo carries the card; one floating elevation tier reserved for sheets and the sticky chat bar.
- **Why:** Airbnb solves BookLoop's exact problem — a photo-led P2P marketplace where amateur photos must look trustworthy; restraint (one font, one accent, one elevation) is also the fastest system for a student team to execute consistently.
- **Instead of:** Copying Airbnb's palette verbatim (their red is their brand), or an unconstrained "pick colors per screen" approach.
- **Status:** ✅ Active

### D-048 — Tailwind-only animation (no framer-motion) + adopted clone UI patterns
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** No animation library. All motion = Tailwind transitions in three tiers (150ms micro for color/opacity · 300ms ease-out for anything that moves/scales · 300ms fades for reveals), animating only transform/opacity. Adopted patterns (documented with code in `UI_REFERENCE.md` §6): slide-up+fade sheet choreography with exit-before-unmount and `neutral-800/70` scrim; card-image zoom inside the clipped rounded frame (card chrome never moves); layered white-outline heart button readable on any photo; chip active state via always-present border color swap (no layout shift), state in URL params; scroll-aware header that gains elevation only after scroll; pure-white canvas+cards with grey-only hierarchy.
- **Why:** Best-analyzed clone (divyeshio/next-airbnb, our exact stack) achieves all its smoothness with zero animation libraries; framer-motion in the other clone did work one Tailwind class does. Transform/opacity-only keeps animation cheap on low-end Androids.
- **Instead of:** Adding framer-motion; patterns from humberthc/airbnb-clone-react (rejected wholesale — Ant Design based, violates D-015).
- **Status:** ✅ Active

### D-049 — Home page adopts marketplace shelf anatomy (structure only, own identity)
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** BookLoop Home follows the marketplace homepage skeleton documented in `UI_REFERENCE.md` §7: sticky header (logo · mode tabs All/Buy/Exchange/Free · search pill) → vertical stack of horizontal shelves ("Books for Class 9" profile-aware, "Recently listed", "Free — donations", "Wanted for exchange"), every shelf heading a link into pre-filtered results with a See-all at the end; cards capped at five elements (photo, one badge, title, meta line, price); header + search + first shelf above the fold. Explicit boundary: layout structure only — no reproduction of any brand's visual identity, assets, or trade dress; all colors/type/copy remain BookLoop's per D-047.
- **Why:** Shelves show four different intents in the space a grid spends on one (grids belong on results pages); linked headings make browsing double as navigation; the five-element card is proven at global scale to need no description text.
- **Instead of:** A grid-first homepage, or visually cloning a competitor's skin.
- **Status:** ✅ Active

### D-050 — Home mode tabs + all four shelves built in Phase 3 (not split to Phase 5)
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** The full D-049 Home (mode tabs All/Buy/Exchange/Free and all four shelves including "Wanted for exchange") is built in Phase 3 Task 3.1, since exchange/donate listings already exist from Phase 2's mode toggle. Phase 5 still builds the dedicated Exchange/Donate tab surfaces and close flows.
- **Why:** The data is there from Phase 2; shipping Home complete in Phase 3 avoids reworking the same screen twice and lets the Phase 3 demo show the real homepage.
- **Instead of:** Deferring exchange/free shelves and tabs to Phase 5 alongside their tab surfaces.
- **Status:** ✅ Active

### D-051 — Warm off-white canvas, pure white cards
- **Date:** 2026-09-13
- **Area:** Design
- **Decision:** Page canvas is warm off-white `#FAF9F5` (user preference for an off-white/yellowish white feel); cards, sheets and popovers stay pure `#FFFFFF`; surface-soft warmed to `#F4F2EC` and hairline to `#ECEAE3` so all neutrals share the same temperature. Implemented in `src/app/globals.css`; documented in UI_REFERENCE.md §2/§6.7.
- **Why:** The subtle warm/white contrast lets cards lift off the page with no borders or shadows — softer, cozier feel while keeping the flat photo-led system intact.
- **Instead of:** Pure white canvas + pure white cards (original §6.7 rule 1).
- **Status:** ✅ Active

### D-052 — All project docs live in docs/
- **Date:** 2026-09-13
- **Area:** Process
- **Decision:** Every project document (PROBLEM_STATEMENT, SCREEN_FLOW, TECH, DATABASE_SCHEMA, ARCHITECTURE, WORKFLOW, UI_REFERENCE, DECISIONS, phases/) lives under `docs/` — the repo root belongs to the app code. (Files moved by the user during Phase 0 scaffolding.)
- **Why:** Clean separation of code and documentation once the Next.js app occupies the root.
- **Status:** ✅ Active

### D-053 — Better Auth confirmed over provisioned Neon Auth
- **Date:** 2026-09-13
- **Area:** Tech
- **Decision:** Stay with Better Auth (D-019) even though the Neon CLI setup provisioned Neon Auth (JWKS env vars exist in `.env.local`, unused). Better Auth tables generated via its CLI into `src/db/auth-schema.ts` and pushed alongside our schema; sessions/passwords/verification live in our Neon DB; `nextCookies()` plugin lets server actions set session cookies. Signup = server action calling `auth.api.signUpEmail` + our `users` profile insert (linked by `auth_id`); email verification state is owned by Better Auth and lazily mirrored to `users.email_confirmed` on session read. Email sending: Resend when `RESEND_API_KEY` exists, console fallback in dev (verification URL in server logs).
- **Why:** D-019's reasons hold (own-DB user table, roster-verification flag path); switching auth systems mid-build for a service we didn't evaluate would be scope drift. Neon Auth remains available as a future option if Better Auth becomes a limitation.
- **Instead of:** Adopting Neon Auth because it happened to be provisioned.
- **Status:** ✅ Active

---

*Next entry: D-054.*
