# Rehearsal: BookLoop reservation journey

Gold: `hero-demo` — kept the hero-beside-copy framing, the crop with the window
inset top/left and cut at the right edge, the typed composer with its send
hand-off, and the compact redesign at 358. The thread follows the
`imessage`/`messages` studies (bubbles, stamps, bottom-anchored scroll), and the
frames are the kit's `Window` and `Phone` at true iOS proportions. The look is
BookLoop's: forest ground, warm off-white canvas, loop-green accent, Inter for
the UI and Fraunces for the cover mark.

Beats: 1 lift the cover on the reservation opening · 2 buyer types and sends
"Perfect — see you there!" · 3 accept the reservation, pointer withdraws ·
4 seller hands over at the library, buyer confirms receipt · 5 buyer rates,
the outcome card and rating stamp hold as the payoff. Loop ≈13 s; the reset
happens behind the stage's own forest cover, so the seam is a blink, not a cut.

Captured: wide 600×624 (`bl-wide-still.png`, `bl-wide-poster.png`,
`bl-wide-states.png`, `bl-wide-loop-v3.png`) and compact 358×755 from a 390
viewport (`bl-compact-still.png`, `bl-compact-poster.png`,
`bl-compact-states.png`, `bl-compact-loop-v3.png`), plus the send proof at
40 ms (`bl-send-detail.png`, `bl-send-40ms.png`) and the payoff/seam
(`bl-payoff-seam.png`). All under `artifacts/stageshow/`.

Film: `film.mjs --gate` at both widths ends `rehearsal passed`. Sampling-gap
lines were inconclusive, not findings. Manual notes are the tracker dot's
number→check tick (a 0.28 s animated swap, by design). The compact gate ends
with a deferred layout line because the capture window closes while the second
loop is mid-typing; the `--states` sheet shows every settled state.

Review: fresh-eye review of the filmed frames, ranked by the whole composition.
Findings and responses are in the sections below.

Assumptions: the demo is a consumer product story, so the wide view is the
buyer's chat in a browser window and the compact view is the same chat in the
buyer's hand. The book, names, price and class are the site's existing
marketing test data.

Unresolved: the stage pauses off screen (kit behaviour), so on phones it starts
when the hero card is scrolled into view; the conversation is a static fixture,
not live data.

Not checked: real iOS/Android Safari rendering (Chromium only); screen-reader
navigation (the card is `aria-hidden` + `inert`, so there is nothing to land
on); the seam on a 120 Hz display; the demo against a live seller/buyer session.

## Review

1. **The thread sliced bubbles at its side edge.** A bubble's rounded end and
   timestamp were cut by the pane's edge in early frames, which read as a crop
   mistake rather than a scrolled chat.
2. **The compact design floated a phone inside a card.** The device sat in the
   forest field with even air on four sides — a screenshot in a box, not a
   product shot.
3. **The tracker and the action bar said the same thing twice.** "Waiting on
   Aarav" above a band that repeated it in a disabled button.
4. **Rating left the action band empty.** The payoff finished with the rate row
   gone and nothing in its place.
5. **Gate buttons did not share one geometry.** Some rows read as full-width
   actions, others as small labels, so each gate looked like a different
   component.
6. **The compact design lost the five-step story.** It had a status line but no
   visible progress, so the phone told a shorter story than the web.
7. **The loop's reset showed a long blank frame.**
8. **The send had no readable hand-off.** The message appeared in the thread
   without a landing frame tied to the composer.
9. **The ghost button snapped between gates.** The kit's 4 px state travel and
   the label's width change nudged an identical button by ~1 px across and
   ~4 px down at the swap.

## Response

- Thread panes now inset their content (24 px wide, 16 px in the hand) and the
  wide thread opens on a whole bubble ("Works for me.") with a settled gap
  above the composer; nothing real is sliced at a side edge.
- The compact stage is the phone: 358×755, bezel frame at 0,0, the stage's
  ground black, the screen's own status bar and home indicator. No cursor in
  the hand.
- The strip names the gate ("Reserved for you" / "Waiting on Aarav" / …); the
  action band carries the instruction and only that.
- Rating lands an "Exchange complete · Science IX · ₹180" card in the band the
  rate row vacated, plus a "You rated Aarav 👍" stamp in the thread.
- Every gate draws one row: the primary action fills the width, the ghost keeps
  a fixed 96 px (112 px at phone type) so "Cancel" and "Report issue" occupy
  the same box.
- The phone's tracker is the status line plus five mini dots with connector
  lines; the same steps, at the app's own scale.
- The seam drops the forest cover in 0.14 s, holds while the state snaps back,
  and lifts in 0.14 s — one dark frame at 250 ms sampling, a blink in motion.
- The reply is a `Bubble source="composer-text"`; the field clears as the
  bubble lands, and the gate advances a beat later, so the send is its own
  readable event (`bl-send-detail.png`).
- Action panels fill one held box and skip the kit's 4 px label travel; the
  ghost's fixed width means the identical button lands exactly where it was.
  The gate's handoff line is gone.

Not changed, with reason: the wide window keeps its 24 px forest margin on
top/left/bottom and is cut 40 px past the right edge. The composer and both
actions have to stay whole (rule 4), so the window cannot bleed at the foot;
the uniform 24 px gutter is the final crop's one gutter, and the right edge is
well past the 24 px threshold.

## Integration

- `src/components/marketing/stageshow/BookloopHero.tsx` + `bookloop.css`: the
  demo, importing only the kit parts it draws (`./kit`).
- `src/components/marketing/hero.tsx`: the forest card in the hero's right
  column, `aria-hidden` + `inert` (decorative; the copy beside it carries the
  promise), the `HeroMarquee` and photos unchanged.
- The frame's height is CSS-driven (`aspect-ratio: 358 / 755` below the card's
  560 px container query) so the server render and the hydrated stage occupy
  the same box; the wide ratio is 600 / 624.
- Reduced motion shows the poster (step 5, whole journey) via the kit's
  `useSyncExternalStore` media-query subscription, so the first paint is right.
