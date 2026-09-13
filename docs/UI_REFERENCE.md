# BookLoop — UI Design Reference (Airbnb DLS Analysis)

**Source:** [superdesign.dev/blog/airbnb-design-system](https://superdesign.dev/blog/airbnb-design-system) — a reconstruction of Airbnb's internal Design Language System (DLS).
**Caveat from the source itself:** Airbnb publishes no official design system; token values below are community-observed. That's fine — we're stealing the *method*, not the brand.
**Last updated:** 13 Sep 2026 · Decisions from this doc: D-047 (tokens & DLS method), D-048 (motion standard & clone patterns), D-049 (Home shelf anatomy)

---

## 1. Deep analysis — why Airbnb's UI feels premium

Airbnb is the single best reference for BookLoop because it solves *our exact problem*: a **photo-led peer-to-peer marketplace** where ordinary people's photos must look trustworthy and a complex search must feel calm. Five mechanisms do all the work:

### 1.1 Restraint is the system
One typeface. One accent color. One elevation tier. Soft shapes. Everything else is neutral. The "design" isn't decoration — it's the *discipline of removing options*, which is exactly what a student team needs: fewer choices per screen = faster building AND better output.

### 1.2 One red, one job
`#FF385C` appears in exactly one place per screen: the primary action (Reserve, Search). Because nothing else is red, the eye finds the next step instantly — no visual competition. This is a **wayfinding system disguised as a color choice**. Everything else runs on inks and greys (`#222`, `#484848`, `#767676`), so the accent never fights for attention.

### 1.3 Photos carry the depth, not shadows
Airbnb's listing card has **no border and no shadow** — a rounded photo, a heart, a price, a rating. Depth comes from photography, whitespace, and rounded image clipping. One subtle elevation tier exists for things that float (sheets, dropdowns). The insight for BookLoop: **student book photos are our hero content too** — frame them well and the UI needs almost no chrome. Bad photos in heavy card chrome look worse; bad photos in a clean rounded frame with good whitespace look honest.

### 1.4 One typeface, weight-only hierarchy
Airbnb Cereal (their bespoke font) does everything — hierarchy comes from **weight and size only**, never a second family. Cereal's traits (tall x-height, open apertures) exist for small-screen legibility — exactly our cheap-Android constraint. Cereal is licensed; the article's recommended free substitute is **Inter**, which shares the same geometric-humanist, tall-x-height DNA.

### 1.5 Calm compression of complexity
The pill search bar compresses a four-part query (where/when/who) into one soft shape. The category icon strip turns filtering into a scannable, tappable row with an active underline. Lesson: **complex controls should look like one simple object**, revealing complexity only on interaction — this maps 1:1 to our filter chips and search (WORKFLOW.md §3).

### The four DLS principles (Karri Saarinen, 2016)
**Unified** (every piece contributes to the whole) · **Universal** (welcoming, accessible) · **Iconic** (bold, clear) · **Conversational** (motion communicates). Worth keeping verbatim — they're evaluation questions for every screen we ship.

---

## 2. BookLoop design tokens (adapted, not copied)

We adopt Airbnb's *structure* with our own identity. Books + sustainability → **green as the single accent** (their red stays theirs).

### Color

| Token | Value | Job (one job each) |
|---|---|---|
| `primary` | `#0E9F6E` (loop green) | THE accent: primary CTA, active nav item, active chip underline — **one primary action per screen** (WORKFLOW.md law 3) |
| `primary-active` | `#057A55` | Pressed/active state of primary |
| `primary-soft` | `#DEF7EC` | Subtle tinted backgrounds (badges, success states) |
| `ink` | `#222222` | Headings, prices — the "black" |
| `body` | `#484848` | Body text |
| `muted` | `#767676` | Secondary text, placeholders, timestamps |
| `canvas` | `#FAF9F5` (warm off-white — D-051) | Page background |
| `card` | `#FFFFFF` | Cards, sheets, popovers — pure white on the warm canvas = borderless lift |
| `surface-soft` | `#F4F2EC` (warmed to match) | Soft panels: filter bar, chat bubbles (other side), input backgrounds |
| `border` | `#ECEAE3` (warm hairline) | Hairline dividers only — not card borders |
| `free` | `#E8590C` (warm orange) | FREE/donation badge only (mirrors Airbnb's Arches accent role) |
| `danger` | `#E02424` | Destructive actions/errors only |

**Rules:** green = exactly one primary action per screen; orange = donations only; everything else neutral. If a screen has two green buttons, one of them is wrong.

### Typography — Inter, weight-only hierarchy

| Role | Size / weight | Use |
|---|---|---|
| Display | 24px / 700 | Screen titles ("Sell a book") |
| Title | 18px / 600 | Card titles, section headers |
| Body | 15px / 400 | Everything default |
| Emphasis | 15px / 600 | Prices, chip labels, buttons |
| Caption | 13px / 400 muted | Timestamps, condition notes, helper text |

One family (Inter + system-ui fallback), never a second display font. Prices always `ink` + 600 — like Airbnb, price is content, not decoration.

### Spacing — 4px grid
Scale: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64** (Tailwind's default maps directly). Marketplace density like Airbnb's: cards sit closer (12–16px gaps) than typical SaaS layouts; generous space (24–32px) separates *sections*, tight space groups *related* things.

### Radius

| Element | Radius |
|---|---|
| Buttons, inputs, chips | 8px (`rounded-lg`) |
| Cards & book photos | 16px (`rounded-2xl`) |
| Search bar | full pill (`rounded-full`) |
| Sheets/dialogs | 16px top corners |
| Avatars, icon buttons | circle |

### Elevation — one tier only
- Flat by default: **book cards have no border, no shadow** — rounded photo + whitespace does the work.
- The single floating tier (`shadow-lg`, y-offset small) is reserved for: bottom sheets, dropdowns, the sticky Chat-with-Seller bar.
- Never stack shadows to show importance — importance is shown by the green.

---

## 3. Component mapping — Airbnb pattern → BookLoop component

| Airbnb signature | BookLoop equivalent | Spec |
|---|---|---|
| Listing card | **Book card** | Rounded-2xl photo (4:3), wishlist heart top-right overlay, below: title (Title style, 1 line), class/subject caption, condition tag, price in ink/600 (or FREE in orange). No border, no shadow. |
| Reserve CTA | **Sticky "Chat with Seller" bar** | Solid `primary` green, full-width in a floating bottom bar (the one allowed shadow), the only green on the page. |
| Pill search bar | **Search pill on Home** | Full-round pill, muted placeholder "Search books…", tap expands to search screen with filters — complexity revealed on interaction. |
| Category icon strip | **Category/class chip row** | Horizontally scrollable chips (Textbook · Reference · Competitive · Novels · FREE); active chip = green underline or green-soft fill. Doubles as our filter-chip system (WORKFLOW.md §3). |
| Heart save toggle | **Wishlist heart** | Identical pattern: white heart outline over photo → fills green on tap, optimistic. |
| Photo-led depth | **Book photo framing** | Photos always in rounded frames on white; listing form encourages a clean background shot ("place the book on a table") — the photo IS the card. |

---

## 4. Do / Don't (adapted from the DLS)

**Do**
- Keep green exclusive to the single primary action per screen
- Use photography + whitespace for depth; hairline `border` color only for list dividers
- Weight-only type hierarchy; Inter everywhere
- Round generously (8/16/pill) — soft shapes read as friendly, right for a school app

**Don't**
- Add a second accent or a second font ("just for the logo" is how it starts)
- Put borders + shadows on book cards
- Use green for success toasts AND CTAs on the same screen (success = `primary-soft` bg + ink text instead)
- Ship dense text blocks — captions and one-liners, in Class-6-readable English (Phase 6.5)

---

## 5. Implementation — Tailwind / shadcn wiring

```ts
// tailwind.config.ts — extend
colors: {
  primary: { DEFAULT: "#0E9F6E", active: "#057A55", soft: "#DEF7EC" },
  ink: "#222222",
  body: "#484848",
  muted: "#767676",
  surface: { soft: "#F7F7F7" },
  hairline: "#EBEBEB",
  free: "#E8590C",
},
borderRadius: { lg: "8px", "2xl": "16px" },
fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
```

- Map shadcn CSS variables: `--primary` → loop green, `--radius` → 8px base; card component variant with `border-0 shadow-none`.
- Inter via `next/font/google` (self-hosted by Next, no layout shift).
- Add these tokens to `lib/constants.ts` mirrors where components need them in TS (e.g., QR/share-card rendering).

**Where this lands in the phase plan:** tokens + Tailwind config → Phase 0 Task 0.2 (UI system) · book card + chips + pill search → Phase 3 · sticky chat bar → Phase 4. This doc is the reference each of those tasks builds against.

---

## 6. Patterns lifted from Airbnb-clone codebases (best-of extraction)

Analyzed three open-source Airbnb clones; kept only what improves BookLoop. Sources: [divyeshio/next-airbnb](https://github.com/divyeshio/next-airbnb) (Next.js App Router + Tailwind — our stack), [windsuzu/airbnb-clone](https://github.com/windsuzu/airbnb-clone) (Next.js + Tailwind + framer-motion). [humberthc/airbnb-clone-react](https://github.com/humberthc/airbnb-clone-react) was reviewed and **rejected** — built on Ant Design, which violates our one-UI-system rule (D-015); nothing to take.

### 6.1 Motion standard: Tailwind-only, three timings (D-048)
The best-feeling clone (divyeshio) uses **zero animation libraries** — every "smooth" moment is Tailwind transitions. windsuzu ships framer-motion for what amounts to a 400ms opacity fade — a library for something one class does. Verdict: **no framer-motion in BookLoop**; shadcn/Radix built-in animations + these three Tailwind timings cover everything:

| Tier | Timing | Used for |
|---|---|---|
| Micro | `transition` (150ms) | color/opacity: hearts, chips, button hovers, underlines |
| Move | `duration-300 ease-out` | anything that travels or scales: sheets, modals, card zoom |
| Reveal | `duration-300` fade | panels/dropdowns appearing |

One rule: animate only `transform` and `opacity` (GPU-cheap — matters on cheap Androids). Never animate layout properties.

### 6.2 Sheet/modal choreography (from divyeshio's Modal)
The pattern that makes their modals feel native:
- **Slide-up + fade together:** `translate-y-full opacity-0` → `translate-y-0 opacity-100`, `duration-300`
- **Exit completes before unmount:** close sets the exit classes first, `setTimeout(onClose, 300)` after — the modal animates out instead of vanishing
- **Scrim:** `bg-neutral-800/70` — dark enough to focus, light enough to feel airy on white
- **Mobile-first sizing:** full-screen sheet on phones → centered card (`md:w-4/6 lg:w-3/6`) on desktop

→ Apply to: signup sheet (Task 1.3), filter sheet, confirm dialogs. shadcn's Sheet/Dialog already animate via Radix — set their duration/scrim to these values rather than defaults.

### 6.3 Card image zoom inside a clipped frame (from divyeshio's ListingCard)
```tsx
<div className="group cursor-pointer">
  <div className="aspect-square relative overflow-hidden rounded-2xl">
    <Image fill className="object-cover group-hover:scale-110 transition duration-300 ease-out" ... />
    <div className="absolute top-3 right-3">{/* wishlist heart */}</div>
  </div>
  {/* text stack: flex flex-col gap-2, title 600, caption muted */}
</div>
```
The zoom happens INSIDE the rounded frame (`overflow-hidden`) — the card itself never moves or grows a shadow. Photo does the delight; chrome stays still. Desktop hover only (touch devices skip it naturally). This is our **book card** spec from §3, now with the exact classes.

### 6.4 Layered heart button — readable on ANY photo (from divyeshio's HeartButton)
Two stacked icons: white **outline** heart (28px, offset −2px) on top of the **fill** heart (24px). The white ring guarantees visibility over dark and light book photos alike — no background circle needed (more minimalist than Airbnb's own).
```tsx
<div className="relative hover:opacity-80 transition cursor-pointer">
  <Heart size={28} className="fill-white absolute -top-[2px] -right-[2px]" />
  <Heart size={24} className={saved ? "fill-primary" : "fill-neutral-500/70"} />
</div>
```
Fill = `primary` green when saved (their rose-500 stays theirs), `neutral-500/70` when not.

### 6.5 Chip active state = underline via border color swap (from divyeshio's CategoryBox)
```
border-b-2 transition
selected: border-b-primary text-ink
idle:     border-transparent text-muted   (hover:text-ink)
```
The trick: the border is **always there**, only its color changes (`border-transparent` → colored) — so activating a chip never shifts layout. State lives in the **URL query param** (already our Task 3.2 plan — this confirms it), and tapping the active chip deselects it. Apply to the category chip row and filter chips.

### 6.6 Scroll-aware header (from windsuzu's header)
Header starts flush with the canvas (`bg-transparent`... for us: plain white, no border) and gains `shadow-md` / a hairline **only after scrolling** (`window.scrollY === 0` toggle + `transition ease-out`). Elevation on demand: the page opens fully flat and calm; separation appears exactly when content starts sliding under the header. Apply to Home's header + search pill; skip their logo-resize (unneeded complexity).

### 6.7 White handling — what "best white" actually is (synthesis)
The clean look in these clones comes from four disciplined choices, now our rules:
1. **Warm off-white canvas (`#FAF9F5`), pure white cards/sheets (D-051)** — the slight warmth makes white surfaces lift without borders or shadows; flat until something floats.
2. **Separation without boxes:** whitespace (`gap-2` stacks, section spacing) and rounded photos separate content — hairlines only for true list dividers.
3. **Grey does the hierarchy:** secondary text in `muted`, never smaller-and-black; disabled = opacity, not new greys.
4. **The scrim is the darkest thing in the app** (`neutral-800/70`) — depth appears only during focus moments (sheets), and the white beneath feels brighter for it.

---

## 7. Live homepage anatomy → BookLoop Home blueprint

Structural analysis of airbnb.co.in's live homepage (Sep 2026). **Boundary:** we adopt the layout skeleton (standard marketplace patterns), never their brand skin — colors, type and copy stay BookLoop's (D-047).

### Their structure, observed
1. **Sticky header** = logo · mode tabs (All / Homes / Experiences / Services) · segmented pill search (Where · When · Who → search button) · profile/menu cluster.
2. **Body = vertical stack of horizontal shelves.** Each shelf: a **heading that is itself a link** to full filtered results ("Popular homes in Noida" →), ~8 cards in a horizontal scroller, "See all" at the end.
3. **Card content order:** big photo → small badge overlaid ("Guest favourite") → one-line title (type + place) → price line → rating. Nothing else.
4. **Above the fold:** header + search + exactly one shelf. The product is visible immediately; everything else arrives on scroll.
5. **Whitespace rhythm:** generous space *between* shelves, tight space *inside* cards.
6. **Footer:** compact link columns — support, hosting, company.

### BookLoop Home, mapped 1:1

| Their slot | BookLoop's version |
|---|---|
| Mode tabs | **All · Buy · Exchange · Free** — one tap re-scopes every shelf (mode chips from §3/§6.5) |
| Segmented pill search | Search pill: single field for the prototype ("Search books…"), expands to the filter screen — segmentation (Class · Subject · Price) is a later upgrade slot |
| Location shelves | **Context shelves:** "Books for Class 9" (profile-aware) · "Recently listed" · "Free — donations" · "Wanted for exchange" — each heading links to pre-filtered results, ends with See all |
| "Guest favourite" badge | **Condition tag** (Like New) or **FREE** badge — one small overlay max per card |
| Title = type + place | Title = book title; caption = "Class 9 · Science" |
| Price for stay | Price in ₹ (or FREE / EXCHANGE) |
| Rating line | Seller 👍 count (once Phase 4 lands) |
| Above the fold | Header + search pill + the class shelf — books visible before any scroll, zero-state never shown to guests (seeded shelves, D-011) |
| SEO link grid | Skipped — pilot needs no SEO directory |
| Footer | Minimal: school name, "How BookLoop works", report a problem, terms |

### The three structural lessons worth stating
1. **Shelf headings are links, not labels.** Every heading doubles as navigation into filtered results — browsing IS searching. Costs nothing to build, makes the whole page tappable.
2. **Horizontal shelves beat a grid on the homepage.** Shelves let one screen show four *different* intents (your class / newest / free / exchange) in the space a grid spends on one. Grids belong on results pages, shelves on Home.
3. **The card is five things maximum** — photo, one badge, title, meta line, price. Their card survives at global scale with no description text on it; ours needs none either.

→ Builds in **Phase 3 Task 3.1** (shelves + cards) and **Task 3.2** (mode tabs + search pill); already consistent with SCREEN_FLOW.md's Home section.

---

## 8. What the source doesn't cover (our own calls, made elsewhere)
Type-scale precision, motion timings, iconography detail and deep accessibility specs aren't in the article. Our standing answers: lucide-react icons at 20/24px (TECH.md), motion = subtle and functional only (150–200ms ease-out on sheets/toasts; "Conversational" principle), accessibility = WORKFLOW.md friction budgets + Phase 6.5 copy/tap-target pass + contrast-checked tokens above (green on white passes AA for large text/UI elements; body inks pass AA for text).
