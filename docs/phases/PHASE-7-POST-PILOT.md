# Phase 7 — Post-Pilot / Full Launch

**Goal:** what gets built *after* the trial proves demand — sequenced by pilot data, not guesses. Do not start anything here before the trial has run.
**Entry condition:** pilot has real usage data + school feedback; team has reviewed metrics from Phase 6.

## Candidate tracks (order decided by pilot evidence)

### 7A — Student verification (D-008 Phase 2)
- Collect 11-digit Student ID + name → match against school-provided roster → `users.verified = true`, "Verified student" badge.
- Schema is ready (D-029: `student_id`, `verified` columns already live); needs: roster import tool, verify flow UI, school data-sharing agreement (flagged early — PROBLEM_STATEMENT §6).
- **Trigger:** school partnership formalized / trust issues observed in pilot.

### 7B — Exchange matching engine (D-031)
- Structured book identity (normalize titles → book catalog) → inverse-pair matching ("A wants what B has, B wants what A has") → later multi-way chains (graph cycle detection).
- **Trigger:** pilot shows exchange offers going unmatched despite compatible inventory.

### 7C — School sustainability dashboard (D-010 revenue)
- Books reused, money saved (sum of closed-transaction prices vs. new-book estimates), waste avoided; per-school view.
- This is the **subscription product** — build when pitching school #2, using school #1's real numbers.

### 7D — Scale seams (ARCHITECTURE.md §7 — upgrade only what hurts)
| Seam | Upgrade | Trigger from pilot data |
|---|---|---|
| Chat polling | Pusher/Ably | Vercel invocations approaching free-tier ceiling |
| Sync alert matching | Inngest / Vercel Cron + jobs table | Publish action noticeably slow |
| `ILIKE` search | Postgres full-text | Search misses/feels dumb past ~10k listings |
| DB-count rate limits | Upstash | Real abuse observed |
| Single-school data | `school_id` scoping (additive migration) | School #2 signs |
| UploadThing raw photos | Cloudinary compression | Storage near 2GB |
| PWA | React Native/Expo | Retention demands push notifications |

### 7E — Community & growth
- Donation leaderboard + expanded badges (gamification — PROBLEM_STATEMENT §7)
- Bundle listings (full class-set in one listing)
- Seasonal pushes aligned to school calendar (term end = sell prompts, admissions = buy prompts)
- QR scan → book history ("this book has served 3 students")

## Rules for this phase
1. Nothing starts without a trigger observed in pilot data or a school commitment.
2. Each track gets its own detailed phase doc (PHASE-7A-… style) **when activated** — written in the same task format as Phases 0–6: numbered tasks, build boxes, one 🧪 Test box each, and a phase gate. Tracks are deliberately not task-divided now, because their scope depends on pilot evidence.
3. Every activation decision → `DECISIONS.md`.
