# Phase 5 — Exchange & Donate

**Goal:** light up the other two modes. Cheap phase by design — listings, discovery and chat/close machinery already handle `mode=exchange|donate`; this builds their dedicated surfaces.
**Demo at the end:** exchange offer → "For you" shelf on another account → chat → both mark exchanged. Donation → FREE shelf → claimed → donor badge.
**Depends on:** Phase 4. **Rough effort:** 3–5 days.

> **Tick rule:** a task is complete only when ALL its boxes are ticked — the 🧪 **Test** box only after the test actually passed.

---

## Task 5.1 — Exchange tab
- [ ] Two views (SCREEN_FLOW E1): **Offers** list as one-line `HAS: Class 8 Science ⇄ WANTS: Class 8 Maths` cards → detail → chat; **Post an offer** = sell form with mode preset to Exchange
- [ ] 🧪 **Test:** posted offer renders as a correct HAS⇄WANTS card; tapping through reaches detail and (Phase 4) chat

## Task 5.2 — "For you" shelf
- [ ] Query: active exchange offers whose `wants_book` text-matches (ILIKE) titles of MY active listings — no engine, one query (D-031)
- [ ] Shelf at top of Exchange tab: "These people want books you have"
- [ ] 🧪 **Test:** account A lists "Class 8 Maths (NCERT)"; account B posts an offer wanting "Class 8 Maths" → the offer appears in A's shelf; delisting A's book empties it

## Task 5.3 — Exchange close flow
- [ ] Stepper labels adapt for exchange (Exchanged instead of Sold); both sides confirm handover of both books
- [ ] Both listings involved end `closed` with a transaction each
- [ ] 🧪 **Test:** full two-device exchange → both listings closed, both steppers show the full history, ratings prompt fires for both

## Task 5.4 — Donate surfaces
- [ ] "Free — donations available" Home shelf goes live; Donations tab: browse + post (form with mode=Donate, price hidden)
- [ ] **FREE badge** wherever a price would appear; donations included under the Free filter toggle
- [ ] 🧪 **Test:** donation shows on Home shelf + Free filter; no price visible anywhere for it (cards, detail, chat header, share card)

## Task 5.5 — Claim flow
- [ ] Claim = Chat → seller reserves → shows "**Claimed**" to everyone else; same confirm-close + 72h expiry machinery (D-043)
- [ ] 🧪 **Test:** claimed donation leaves search and shows Claimed; expiry test (73h fake) → available again

## Task 5.6 — Donor badge & share card
- [ ] First completed donation → badge on donor profile + shareable "I gave a book a second life 📚" card (Web Share)
- [ ] 🧪 **Test:** completing a donation grants the badge exactly once; share card renders and opens WhatsApp

## Task 5.7 — Mode filters everywhere
- [ ] Filter chips include mode: Buy · Exchange · Free; search/results respect them; category filters compose with mode
- [ ] 🧪 **Test:** each mode chip returns exactly its subset; combos (e.g., Exchange + Class 8) correct against DB truth

---

## Phase gate — tick to close the phase
- [ ] All 7 tasks fully ticked
- [ ] Two-device exchange lifecycle AND donation lifecycle pass on production
- [ ] All four modes now demoable end-to-end — the full PROBLEM_STATEMENT.md §2 table is real
- [ ] Decisions made this phase logged in `DECISIONS.md`
