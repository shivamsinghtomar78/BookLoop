"use client";

import type { ReactNode } from 'react'
import { Check, Send, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Bubble, Phone, Stage, Stamp, States, Thread, Window, type Act } from './kit'
import './bookloop.css'

// BookLoop's reservation journey in the buyer's chat: the seller reserves the
// textbook, the buyer accepts, the seller hands it over at the library, the
// buyer confirms and rates. On the web the five-step tracker stays open beside
// the chat; on a phone it is the status line and five dots the app shows.

type S = {
  /** The tracker's current gate: 1 reserved · 2 accepted · 3 handed over · 4 confirmed · 5 rated */
  step: number
  /** System notes in the thread: 1 reserved · 2 handed over */
  system: number
  draft: string
  focused: boolean
  sent: boolean
  /** The scene starts and resets behind a cover, so the loop has no seam */
  covered: boolean
}

const initial: S = { step: 1, system: 1, draft: '', focused: false, sent: false, covered: true }
const POSTER: S = { ...initial, step: 5, system: 2, sent: true, covered: false }

const STEPS = ['Chatting', 'Reserved', 'Meet at pickup', 'Done', 'Rate'] as const

// The strip names the gate; the action bar holds the instruction, so nothing
// is said twice
const STATUS: Record<number, string> = {
  1: 'Reserved for you',
  2: 'Waiting on Aarav',
  3: 'Handed over',
  4: 'Received',
  5: 'Complete — rated',
}

const STATUS_STATES: Record<StepKey, ReactNode> = {
  '1': <span className="bl-status__line">{STATUS[1]}</span>,
  '2': <span className="bl-status__line">{STATUS[2]}</span>,
  '3': <span className="bl-status__line">{STATUS[3]}</span>,
  '4': <span className="bl-status__line">{STATUS[4]}</span>,
  '5': <span className="bl-status__line">{STATUS[5]}</span>,
}

const REPLY = 'Perfect — see you there!'

type StepKey = '1' | '2' | '3' | '4' | '5'

// In the wide window's left gutter, clear of the payoff line; the compact
// design has no pointer at all
const REST = {
  wide: { x: 2, y: 300 },
  compact: { x: 0, y: 0 },
}

async function script(a: Act<S>) {
  // The scene starts behind the cover; lifting it is the first beat
  await a.set({ covered: false })
  await a.wait(520)
  await a.mark('opening')
  await a.wait(380)

  // The buyer replies to the meet-up plan
  await a.click('composer')
  await a.set({ focused: true })
  await a.wait(250)
  await a.type('draft', REPLY, { interval: 40 })
  await a.wait(350)
  await a.mark('send')
  await a.click('send')
  await a.set({ sent: true, draft: '', focused: false })
  await a.wait(1000)

  // Gate 2 — accept the reservation, then let the pointer withdraw to wait
  await a.click({ at: 'accept', x: 0.93, y: 0.5 })
  await a.set({ step: 2 })
  await a.mark('accepted')
  await a.wait(500)
  await a.move('rest')
  await a.wait(800)

  // Gate 3 — the seller hands it over at the library
  await a.set({ step: 3, system: 2 })
  await a.mark('handover')
  await a.wait(1700)

  // Gate 4 — confirm receipt
  await a.click({ at: 'confirm', x: 0.93, y: 0.5 })
  await a.set({ step: 4 })
  await a.mark('confirmed')
  await a.wait(1100)

  // Rate, let the pointer leave the payoff line, and hold on the record
  await a.click('thumb-up')
  await a.set({ step: 5 })
  await a.mark('done')
  await a.wait(900)
  await a.move('rest')
  await a.mark('payoff')
  await a.wait(1500)

  // Drop the cover, reset behind it, lift it again: a blink, not a blank frame
  await a.set({ covered: true })
  await a.wait(170)
  await a.snap(initial)
  await a.wait(50)
}

function Steps({ step }: { step: number }) {
  return (
    <ol className="bl-steps" aria-label="Exchange progress">
      {STEPS.map((label, i) => {
        const done = i < step
        const current = i === step
        return (
          <li key={label} className="bl-step" data-done={done || undefined} data-current={current || undefined}>
            <span className="bl-dot">{done ? <Check size={10} strokeWidth={3.2} aria-hidden /> : i + 1}</span>
            <span className="bl-lbl">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

// The phone's version of the tracker: the same five steps as one quiet row
function MiniSteps({ step }: { step: number }) {
  return (
    <ol className="bl-mini" aria-label="Exchange progress">
      {STEPS.map((label, i) => (
        <li key={label} className="bl-mini__step" data-done={i < step || undefined} data-current={i === step || undefined}>
          <span className="bl-mini__dot">{i < step ? <Check size={8} strokeWidth={3.4} aria-hidden /> : null}</span>
          {i < STEPS.length - 1 && (
            <span className="bl-mini__line" data-done={i < step || undefined} aria-hidden />
          )}
        </li>
      ))}
    </ol>
  )
}

// The conversation as it happened, in order. The phone shows it from its first
// line; the desktop window is shorter, so it opens on the last of it above the
// composer, the way a scrolled chat does.
const OPENING: { from: 'me' | 'them'; text: string; time: string }[] = [
  { from: 'me', text: 'Hi! Saw your Science IX listing.', time: '3:58' },
  { from: 'them', text: 'Yes — 2023 NCERT. Barely used.', time: '3:58' },
  { from: 'me', text: 'Any marks or torn pages?', time: '3:59' },
  { from: 'them', text: 'A few pencil notes in chapter 4.', time: '4:00' },
  { from: 'me', text: "That's fine. Is ₹180 okay?", time: '4:01' },
  { from: 'them', text: 'Works for me.', time: '4:02' },
  { from: 'me', text: 'Can we meet at the school library?', time: '4:03' },
  { from: 'them', text: "Sure — I'll reserve it for you.", time: '4:04' },
]

function Chat({ s, phone }: { s: S; phone?: boolean }) {
  return (
    <div className={`bl-app${phone ? ' bl-app--phone' : ''}`}>
      <header className="bl-head">
        <span className="bl-cover" aria-hidden>
          IX
        </span>
        <span className="bl-id">
          <span className="bl-title">Science IX</span>
          <span className="bl-sub">with Aarav · ₹180</span>
        </span>
        <span className="bl-live">
          <i aria-hidden />
          online
        </span>
      </header>

      <div className="bl-tracker">
        {phone ? (
          <>
            <States className="bl-status" value={String(s.step) as StepKey} align="start" states={STATUS_STATES} />
            <MiniSteps step={s.step} />
          </>
        ) : (
          <Steps step={s.step} />
        )}
      </div>

      <div className="bl-thread-wrap" data-crop>
        <Thread className="bl-thread">
          {phone && <Stamp>Today 3:58 PM</Stamp>}
          {(phone ? OPENING : OPENING.slice(5)).map((m) => (
            <Bubble key={m.text} from={m.from}>
              {m.text}
              {!phone && <span className="bl-time">{m.time}</span>}
            </Bubble>
          ))}
          {s.system >= 1 && <Stamp className="bl-enter">Aarav reserved this book</Stamp>}
          {s.sent && (
            <Bubble from="me" source="composer-text">
              {REPLY}
              {!phone && <span className="bl-time">4:05</span>}
            </Bubble>
          )}
          {s.system >= 2 && <Stamp className="bl-enter">Handed over at the school library</Stamp>}
          {s.step >= 5 && <Stamp className="bl-enter">You rated Aarav 👍</Stamp>}
        </Thread>
      </div>

      <footer className="bl-foot">
        <div className="bl-actions">
          <States
            value={String(s.step) as StepKey}
            align="start"
            states={{
              '1': (
                <div className="bl-gate">
                  <p className="bl-helper">Accept the reservation so Aarav can hand over.</p>
                  <div className="bl-btns">
                    <button type="button" className="bl-btn bl-btn--primary" data-target="accept" data-cursor="pointer">
                      Accept reservation
                    </button>
                    <button type="button" className="bl-btn bl-btn--ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              ),
              '2': (
                <div className="bl-gate">
                  <p className="bl-helper">Aarav will hand it over at the school library.</p>
                  <div className="bl-btns">
                    <button type="button" className="bl-btn bl-btn--primary" disabled>
                      Awaiting handover
                    </button>
                    <button type="button" className="bl-btn bl-btn--ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              ),
              '3': (
                <div className="bl-gate">
                  <p className="bl-helper">Confirm you received the book from Aarav.</p>
                  <div className="bl-btns">
                    <button type="button" className="bl-btn bl-btn--primary" data-target="confirm" data-cursor="pointer">
                      Confirm received ✓
                    </button>
                    <button type="button" className="bl-btn bl-btn--ghost">
                      Report issue
                    </button>
                  </div>
                </div>
              ),
              '4': (
                <div className="bl-rate">
                  <p className="bl-rate__q">How did it go?</p>
                  <div className="bl-rate__btns">
                    <button type="button" className="bl-iconbtn" data-target="thumb-up" data-cursor="pointer" aria-label="Thumbs up">
                      <ThumbsUp size={16} strokeWidth={1.9} aria-hidden />
                    </button>
                    <button type="button" className="bl-iconbtn" aria-label="Thumbs down">
                      <ThumbsDown size={16} strokeWidth={1.9} aria-hidden />
                    </button>
                  </div>
                </div>
              ),
              '5': (
                <div className="bl-outcome">
                  <span className="bl-outcome__mark">
                    <Check size={14} strokeWidth={3} aria-hidden />
                  </span>
                  <span className="bl-outcome__text">
                    <span className="bl-outcome__title">Exchange complete</span>
                    <span className="bl-outcome__sub">Science IX · ₹180</span>
                  </span>
                </div>
              ),
            }}
          />
        </div>

        <span className="bl-divide" aria-hidden />

        <div className="bl-composer">
          <span className="bl-field" data-target="composer" data-focus={s.focused || undefined} data-cursor="ibeam">
            <span className="bl-field__text" data-target="composer-text" data-typing>
              {s.draft}
              {s.draft && <i className="bl-caret" data-snap />}
            </span>
            <span className="bl-ph" data-hide={s.draft ? '' : undefined}>
              Message…
            </span>
          </span>
          <span className="bl-send" data-target="send" data-active={s.draft ? '' : undefined} data-cursor="pointer">
            <Send size={16} strokeWidth={2} aria-hidden />
          </span>
        </div>
      </footer>
    </div>
  )
}

export function BookloopHero() {
  return (
    <Stage
      width={600}
      height={624}
      compact={{ below: 560, width: 358, height: 755 }}
      initial={initial}
      poster={POSTER}
      script={script}
      cursor={{ at: 'rest', style: 'large' }}
      className="bl"
    >
      {(s, _rect, layout) => (
        <>
          {/* Faded, not removed: the shade is opaque, so this is invisible, but
              the reset behind it still has an exit instead of a cut */}
          <div className="bl-scene" data-cover={s.covered || undefined} style={{ opacity: s.covered ? 0.4 : 1 }}>
            {layout === 'compact' ? (
              // The phone is the card: edge to edge, so no forest frame is
              // left around it, while the status bar and home indicator stay
              // in view
              <Phone width={358} time="4:05" frame="bezel" className="bl-phone">
                <Chat s={s} phone />
              </Phone>
            ) : (
              <Window url="bookloop.school/chats/science-ix" nav urlShape="pill" className="bl-browser">
                <Chat s={s} />
              </Window>
            )}
          </div>

          <span className="bl-rest" data-target="rest" style={{ left: REST[layout].x, top: REST[layout].y }} />
          <div className="bl-shade" style={{ opacity: s.covered ? 1 : 0 }} aria-hidden />
        </>
      )}
    </Stage>
  )
}
