"use client";

// Chat screen (Tasks 4.2–4.7): socket.io push with automatic REST-polling
// fallback (D-055/D-037), stepper, quick-ask chips, pinned pickup card,
// role-aware transaction actions, one-tap ratings.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/chat/stepper";
import {
  askConfirmAction,
  cancelReservationAction,
  confirmReceivedAction,
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
}) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(props.initialMessages);
  const [state, setState] = useState<TxState>(props.initialState);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false); // socket connected?

  const lastIdRef = useRef(props.initialMessages.at(-1)?.id ?? 0);
  const seenIds = useRef(new Set(props.initialMessages.map((m) => m.id)));
  const lastActivityRef = useRef(Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const liveRef = useRef(false);

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
    let cancelled = false;

    async function connect() {
      try {
        const res = await fetch("/api/chat-token");
        if (!res.ok) return; // realtime disabled → polling only
        const { token, url } = (await res.json()) as { token: string; url: string };
        if (cancelled) return;

        const socket = io(url, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnectionDelayMax: 15_000,
        });
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
  }, [props.chatId, append, refetch]);

  // ---- polling fallback (D-037): 4s visible → 15s idle; paused when live/hidden ----
  useEffect(() => {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

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

  const showQuickAsks = props.role === "buyer" && !msgs.some((m) => m.senderId === props.meId);
  const closedOrDeleted =
    state.listingStatus === "closed" || state.listingStatus === "deleted";

  return (
    <div className="mx-auto flex h-[calc(100dvh-11.5rem)] w-full max-w-2xl flex-col md:h-[calc(100dvh-9rem)]">
      {/* Listing header → taps back to the listing */}
      <Link
        href={`/listings/${props.listing.id}`}
        className="flex items-center gap-3 rounded-2xl bg-card p-2.5"
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
          <span className="block truncate text-sm font-medium">
            {props.listing.title}
          </span>
          <span className="text-subtle text-xs">
            with {props.otherName}
            {props.listing.mode === "sell" &&
              props.listing.priceInr != null &&
              ` · ₹${props.listing.priceInr}`}
            {live && " · ⚡ live"}
          </span>
        </span>
      </Link>

      {/* Stepper — same for both sides (D-044) */}
      <div className="mt-2 rounded-2xl bg-card px-3 py-2.5">
        <Stepper state={state} />
      </div>

      {/* Pinned pickup card (D-005) */}
      <div className="bg-primary-soft text-primary-active mt-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs">
        <span>🏫 Meet at the school library/office to hand over books</span>
        <button
          type="button"
          className="shrink-0 font-semibold underline-offset-2 hover:underline"
          onClick={() => send("Can we meet at the pickup point tomorrow at lunch break?")}
        >
          Suggest a time
        </button>
      </div>

      {/* Messages */}
      <div className="mt-2 flex-1 overflow-y-auto rounded-2xl bg-card p-3">
        {msgs.length === 0 && (
          <p className="text-subtle py-8 text-center text-sm">
            Say hi — no phone numbers needed, everything happens here.
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words",
                m.senderId === props.meId
                  ? "bg-primary text-primary-foreground self-end rounded-br-md"
                  : "bg-surface-soft self-start rounded-bl-md",
              )}
            >
              {m.body}
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Transaction actions — role & state aware (Task 4.5) */}
      <TxActions
        role={props.role}
        state={state}
        busy={busy}
        onReserve={() => runState(reserveAction)}
        onCancel={() => runState(cancelReservationAction)}
        onAskConfirm={() => runState(askConfirmAction)}
        onConfirm={() => runState(confirmReceivedAction)}
        onRate={(up) => runState((id) => rateAction(id, up))}
      />

      {/* Quick-ask chips (D-044) */}
      {showQuickAsks && !closedOrDeleted && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5">
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

      {/* Composer */}
      {!closedOrDeleted && (
        <form
          className="mt-2 flex items-end gap-2"
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
            className="border-input max-h-32 min-h-11 flex-1 resize-none rounded-2xl border bg-card px-4 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-10 md:py-2.5 md:text-sm"
          />
          <Button type="submit" size="icon-lg" disabled={busy || !draft.trim()} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

function TxActions({
  role,
  state,
  busy,
  onReserve,
  onCancel,
  onAskConfirm,
  onConfirm,
  onRate,
}: {
  role: "buyer" | "seller";
  state: TxState;
  busy: boolean;
  onReserve: () => void;
  onCancel: () => void;
  onAskConfirm: () => void;
  onConfirm: () => void;
  onRate: (up: boolean) => void;
}) {
  // Rate prompt after close (skippable — it just stays available)
  if (state.confirmed && state.myRating === null) {
    return (
      <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-card p-3">
        <p className="text-sm font-medium">How did it go?</p>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" disabled={busy} onClick={() => onRate(true)} aria-label="Thumbs up">
            <ThumbsUp className="size-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={busy} onClick={() => onRate(false)} aria-label="Thumbs down">
            <ThumbsDown className="size-4" />
          </Button>
        </div>
      </div>
    );
  }
  if (state.confirmed) {
    return (
      <p className="text-subtle mt-2 text-center text-xs">
        Done ✓ — thanks for keeping the loop going 🌱
      </p>
    );
  }

  if (state.listingStatus === "active" && role === "seller") {
    return (
      <Button className="mt-2" size="lg" disabled={busy} onClick={onReserve}>
        Reserve for this buyer
      </Button>
    );
  }

  if (state.reserved) {
    return (
      <div className="mt-2 flex gap-2">
        {role === "buyer" && state.reservedForMe && (
          <Button size="lg" className="flex-1" disabled={busy} onClick={onConfirm}>
            Confirm received ✓
          </Button>
        )}
        {role === "seller" && (
          <Button size="lg" className="flex-1" disabled={busy} onClick={onAskConfirm}>
            Handed over — ask buyer to confirm
          </Button>
        )}
        <Button variant="outline" size="lg" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return null;
}
