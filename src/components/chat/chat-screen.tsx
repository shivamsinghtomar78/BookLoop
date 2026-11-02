"use client";

// Chat screen (Tasks 4.2–4.7): socket.io push with automatic REST-polling
// fallback (D-055/D-037), four-gate deal tracker, quick-ask chips, pinned
// pickup note, role/state-aware transaction actions, one-tap ratings.
// Full-bleed on phones, two-pane beside the list on desktop.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { ArrowLeft, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TxTracker } from "@/components/chat/tx-tracker";
import { actionLabels, statusLine } from "@/components/chat/tx-status";
import { useVisualViewportHeight } from "@/components/chat/use-visual-viewport";
import {
  acceptReservationAction,
  cancelReservationAction,
  confirmReceivedAction,
  handoverAction,
  rateAction,
  reserveAction,
  sendMessageAction,
} from "@/app/(main)/chats/chat-actions";
import type { TxState } from "@/services/transactions";
import { cn } from "@/lib/utils";

type Msg = { id: number; senderId: number; body: string; at: string };

const QUICK_ASKS = [
  "Is this available?",
  "Can we meet tomorrow?",
  "Will you take ₹__?",
];

const POLL_VISIBLE_MS = 4_000;
const POLL_IDLE_MS = 15_000;
const IDLE_AFTER_MS = 120_000;

export function ChatScreen(props: {
  chatId: number;
  meId: number;
  role: "buyer" | "seller";
  otherName: string;
  listing: {
    id: number;
    title: string;
    priceInr: number | null;
    mode: string;
    photoUrl: string | null;
  };
  initialMessages: Msg[];
  initialState: TxState;
  realtime?: boolean;
}) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(props.initialMessages);
  const [state, setState] = useState<TxState>(props.initialState);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false); // socket connected?
  const [now, setNow] = useState(0); // client clock for the 48h nudge
  const [announcement, setAnnouncement] = useState("");
  const viewportHeight = useVisualViewportHeight();

  const lastIdRef = useRef(props.initialMessages.at(-1)?.id ?? 0);
  const seenIds = useRef(new Set(props.initialMessages.map((m) => m.id)));
  const lastActivityRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const liveRef = useRef(false);
  const announcedRef = useRef<string | null>(null);

  const append = useCallback((incoming: Msg[]) => {
    const fresh = incoming.filter((m) => !seenIds.current.has(m.id));
    if (fresh.length === 0) return;
    for (const m of fresh) seenIds.current.add(m.id);
    lastIdRef.current = Math.max(lastIdRef.current, ...fresh.map((m) => m.id));
    setMsgs((prev) => [...prev, ...fresh].sort((a, b) => a.id - b.id));
    lastActivityRef.current = Date.now();
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/chats/${props.chatId}/messages?after=${lastIdRef.current}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Msg[]; state: TxState };
      append(data.messages);
      setState(data.state);
    } catch {
      /* transient — next tick retries */
    }
  }, [props.chatId, append]);

  // ---- socket.io push (D-055), with reconnect handled by the library ----
  useEffect(() => {
    if (!props.realtime) return;
    let cancelled = false;

    async function connect() {
      try {
        const res = await fetch("/api/chat-token");
        if (!res.ok) return; // realtime disabled → polling only
        const { token, url, path } = (await res.json()) as {
          token: string;
          url: string;
          path: string;
        };
        if (cancelled) return;

        const opts = {
          path,
          auth: { token },
          // websocket transport only — HTTP long-polling doesn't work on
          // Vercel Functions (D-060), and we have our own REST fallback anyway
          transports: ["websocket"],
          reconnectionDelayMax: 15_000,
        };
        // "" = same origin (Vercel); explicit URL otherwise (local dev / external host)
        const socket = url ? io(url, opts) : io(opts);
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join", props.chatId, (ok: boolean) => {
            if (!ok) return;
            liveRef.current = true;
            setLive(true);
            void refetch(); // catch anything missed while connecting
          });
        });
        socket.on("message", (e: { message: Msg }) => {
          if (e.message) append([e.message]);
        });
        socket.on("state", () => void refetch());
        socket.on("disconnect", () => {
          liveRef.current = false;
          setLive(false);
        });
        // Tokens are short-lived: re-mint on every reconnect attempt
        socket.io.on("reconnect_attempt", async () => {
          try {
            const r = await fetch("/api/chat-token");
            if (r.ok) {
              const fresh = (await r.json()) as { token: string };
              (socket.auth as { token: string }).token = fresh.token;
            }
          } catch {
            /* keep old token; server will refuse if expired */
          }
        });
      } catch {
        /* no realtime — polling carries the chat */
      }
    }

    void connect();
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [props.chatId, props.realtime, append, refetch]);

  // Client clock for relative-age hints; starts after mount so render stays pure.
  useEffect(() => {
    const prime = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(prime);
      clearInterval(id);
    };
  }, []);

  // ---- polling fallback (D-037): 4s visible → 15s idle; paused when live/hidden ----
  useEffect(() => {
    lastActivityRef.current = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function tick() {
      if (stopped) return;
      const hidden = document.visibilityState !== "visible";
      if (!liveRef.current && !hidden) await refetch();
      const idle = Date.now() - lastActivityRef.current > IDLE_AFTER_MS;
      timer = setTimeout(tick, idle ? POLL_IDLE_MS : POLL_VISIBLE_MS);
    }

    timer = setTimeout(tick, POLL_VISIBLE_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && !liveRef.current)
        void refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetch]);

  // Scroll the transcript itself — never the page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, props.chatId]);

  // Announce gate changes to screen readers (skip the initial render).
  const statusText = statusLine(state, props.role, props.otherName);
  useEffect(() => {
    if (announcedRef.current === null) {
      announcedRef.current = statusText;
      return;
    }
    if (announcedRef.current !== statusText) {
      announcedRef.current = statusText;
      setAnnouncement(statusText);
    }
  }, [statusText]);

  async function send(body: string) {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setDraft("");
    lastActivityRef.current = Date.now();
    const res = await sendMessageAction(props.chatId, text);
    if (res.ok) {
      append([{ id: res.id, senderId: props.meId, body: text, at: res.at }]);
    } else {
      toast.error(res.error);
      setDraft(text); // give the draft back
    }
    setBusy(false);
  }

  async function runState(fn: (chatId: number) => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const res = await fn(props.chatId);
    if (!res.ok) toast.error(res.error ?? "Something went wrong");
    await refetch();
    router.refresh();
    setBusy(false);
  }

  const showQuickAsks =
    props.role === "buyer" && !msgs.some((m) => m.senderId === props.meId);
  const closedOrDeleted =
    state.listingStatus === "closed" || state.listingStatus === "deleted";

  return (
    <div
      data-chat-screen=""
      className="bg-background flex w-full min-h-0 flex-col"
      style={viewportHeight ? { height: viewportHeight } : undefined}
    >
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* Top bar: back to chats + listing identity */}
      <header className="border-hairline bg-card flex shrink-0 items-center gap-1 border-b px-2 pt-[env(safe-area-inset-top)] lg:px-3">
        <Link
          href="/chats"
          aria-label="Back to chats"
          className="text-muted-foreground hover:text-foreground hover:bg-surface-soft flex size-10 shrink-0 items-center justify-center rounded-full lg:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link
          href={`/listings/${props.listing.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-1"
        >
          <span className="bg-surface-soft relative size-10 shrink-0 overflow-hidden rounded-lg">
            {props.listing.photoUrl && (
              <Image
                src={props.listing.photoUrl}
                alt={props.listing.title}
                fill
                sizes="40px"
                className="object-cover"
              />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {props.listing.title}
            </span>
            <span className="text-subtle block truncate text-xs">
              with {props.otherName}
              {props.listing.mode === "sell" &&
                props.listing.priceInr != null &&
                ` · ₹${props.listing.priceInr}`}
              {live && " · ⚡ live"}
            </span>
          </span>
        </Link>
      </header>

      {/* Deal tracker — compact strip on phones, full stepper on desktop */}
      <TxTracker state={state} role={props.role} otherName={props.otherName} />

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="bg-surface-soft/40 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
      >
        {/* Silent-seller nudge (WORKFLOW.md §9): my last message unanswered 48h+ */}
        {(() => {
          const last = msgs.at(-1);
          const silent48h =
            now > 0 &&
            props.role === "buyer" &&
            state.listingStatus === "active" &&
            last &&
            last.senderId === props.meId &&
            now - new Date(last.at).getTime() > 48 * 3600 * 1000;
          return silent48h ? (
            <div className="bg-card border-hairline mb-3 rounded-xl border px-3 py-2 text-xs">
              Seller&apos;s been quiet for a while —{" "}
              <Link
                href="/search"
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                see similar books
              </Link>
            </div>
          ) : null;
        })()}

        {/* Pinned pickup note (D-005) — scrolls with the conversation */}
        <div className="bg-primary-soft text-primary-active mb-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs">
          <span>🏫 Meet at the school library/office to hand over books</span>
          <button
            type="button"
            className="shrink-0 font-semibold underline-offset-2 hover:underline"
            onClick={() => send("Can we meet at the pickup point tomorrow at lunch break?")}
          >
            Suggest a time
          </button>
        </div>

        {msgs.length === 0 && (
          <p className="text-subtle py-8 text-center text-sm">
            Say hi — no phone numbers needed, everything happens here.
          </p>
        )}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Messages"
          className="flex flex-col gap-1.5"
        >
          {msgs.map((m) => {
            const mine = m.senderId === props.meId;
            return (
              <div
                key={m.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-1.5 text-sm break-words",
                  mine
                    ? "bg-primary text-primary-foreground self-end rounded-br-md"
                    : "bg-card border-hairline self-start rounded-bl-md border",
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <time
                  dateTime={m.at}
                  suppressHydrationWarning
                  className={cn(
                    "mt-0.5 block text-[10px] leading-none",
                    mine ? "text-primary-foreground/70 text-right" : "text-subtle",
                  )}
                >
                  {new Date(m.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer + deal actions, pinned above the keyboard */}
      <footer className="border-hairline bg-card flex shrink-0 flex-col gap-2 border-t px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:pb-3">
        {showQuickAsks && !closedOrDeleted && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {QUICK_ASKS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="border-hairline bg-card min-h-10 shrink-0 rounded-full border px-3.5 text-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <TxActions
          role={props.role}
          state={state}
          mode={props.listing.mode}
          busy={busy}
          onReserve={() => runState(reserveAction)}
          onAccept={() => runState(acceptReservationAction)}
          onCancel={() => runState(cancelReservationAction)}
          onHandover={() => runState(handoverAction)}
          onConfirm={() => runState(confirmReceivedAction)}
          onRate={(up) => runState((id) => rateAction(id, up))}
        />

        {!closedOrDeleted && (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Message…"
              aria-label="Message"
              className="border-input bg-background max-h-32 min-h-11 flex-1 resize-none rounded-2xl border px-4 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
            <Button
              type="submit"
              size="icon-lg"
              className="shrink-0 rounded-full"
              disabled={busy || !draft.trim()}
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </form>
        )}
      </footer>
    </div>
  );
}

function TxActions({
  role,
  state,
  mode,
  busy,
  onReserve,
  onAccept,
  onCancel,
  onHandover,
  onConfirm,
  onRate,
}: {
  role: "buyer" | "seller";
  state: TxState;
  mode: string;
  busy: boolean;
  onReserve: () => void;
  onAccept: () => void;
  onCancel: () => void;
  onHandover: () => void;
  onConfirm: () => void;
  onRate: (up: boolean) => void;
}) {
  const labels = actionLabels(mode);

  // Rate prompt after close (skippable — it just stays available)
  if (state.confirmed && state.myRating === null) {
    return (
      <div className="bg-background flex items-center justify-between gap-2 rounded-2xl p-2.5">
        <p className="text-sm font-medium">How did it go?</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={busy}
            onClick={() => onRate(true)}
            aria-label="Thumbs up"
          >
            <ThumbsUp className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={busy}
            onClick={() => onRate(false)}
            aria-label="Thumbs down"
          >
            <ThumbsDown className="size-4" />
          </Button>
        </div>
      </div>
    );
  }
  if (state.confirmed) {
    return (
      <p className="text-subtle text-center text-xs">
        Done ✓ — thanks for keeping the loop going 🌱
      </p>
    );
  }
  if (state.listingStatus === "deleted") return null;

  if (state.listingStatus === "active") {
    if (role !== "seller") return null;
    return (
      <Button size="lg" disabled={busy} onClick={onReserve}>
        {labels.reserve}
      </Button>
    );
  }

  if (!state.reserved) return null;

  // Gate 2 — buyer accepts the reservation
  if (!state.accepted) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-subtle text-xs">
          {role === "buyer"
            ? "Accept the reservation so the seller can hand over."
            : "Waiting for the buyer to accept the reservation."}
        </p>
        <div className="flex gap-2">
          {role === "buyer" && state.reservedForMe && (
            <Button size="lg" className="flex-1" disabled={busy} onClick={onAccept}>
              {labels.accept}
            </Button>
          )}
          <Button variant="outline" size="lg" className="flex-1" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Gate 3 — seller marks the handover
  if (!state.handedOver) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-subtle text-xs">
          {role === "seller"
            ? "Meet at the pickup point, then mark the handover."
            : "Waiting for the seller to hand over the book."}
        </p>
        <div className="flex gap-2">
          {role === "seller" && (
            <Button size="lg" className="flex-1" disabled={busy} onClick={onHandover}>
              {labels.handover}
            </Button>
          )}
          <Button variant="outline" size="lg" className="flex-1" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Gate 4 — buyer confirms receipt
  return (
    <div className="flex flex-col gap-2">
      <p className="text-subtle text-xs">
        {role === "buyer"
          ? "The seller marked it handed over — confirm you received it."
          : "Waiting for the buyer to confirm receipt."}
      </p>
      {role === "buyer" && (
        <Button size="lg" disabled={busy} onClick={onConfirm}>
          {labels.confirm}
        </Button>
      )}
    </div>
  );
}
