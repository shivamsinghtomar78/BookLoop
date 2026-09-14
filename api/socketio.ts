// BookLoop realtime ON VERCEL (D-060, fixes D-055's "can't run on Vercel").
// Vercel Functions support WebSockets on Fluid Compute: export an http.Server
// with Socket.IO attached (root api/ = vanilla Vercel Function, not Next).
// Client must use transports: ['websocket'] and path /api/socketio/socket.io.
//
// Same design as realtime/server.ts (the local-dev twin): PUSH-ONLY —
// writes happen in Next server actions which pg_notify('chat_events');
// every function instance holds its own LISTEN connection while it has
// sockets, so fan-out is correct across instances. Connections close at the
// function's max duration — socket.io's client auto-reconnect + our re-join
// + refetch handle that, and REST polling covers any gap.

import { createServer } from "node:http";
import { Server } from "socket.io";
import { Client, Pool } from "pg";
import { jwtVerify } from "jose";

const SECRET = process.env.CHAT_JWT_SECRET;
const DB_UNPOOLED =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
pool.on("error", (err) => console.error("[pool]", err.message));

const httpServer = createServer((_, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "bookloop-realtime-vercel" }));
});

const io = new Server(httpServer, {
  // Same-origin in production; keep localhost for `vercel dev` testing
  cors: { origin: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"] },
});

io.use(async (socket, next) => {
  try {
    if (!SECRET) return next(new Error("realtime disabled"));
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET),
    );
    socket.data.userId = Number(payload.sub);
    if (!Number.isInteger(socket.data.userId))
      return next(new Error("unauthorized"));
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("join", async (chatId: unknown, ack?: (ok: boolean) => void) => {
    const id = Number(chatId);
    if (!Number.isInteger(id)) return ack?.(false);
    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM chats c JOIN listings l ON l.id = c.listing_id
         WHERE c.id = $1 AND (c.buyer_id = $2 OR l.seller_id = $2)`,
        [id, socket.data.userId],
      );
      if (rows.length === 0) return ack?.(false);
      await socket.join(`chat:${id}`);
      ack?.(true);
    } catch (err) {
      console.error("[join]", err);
      ack?.(false);
    }
  });

  socket.on("leave", (chatId: unknown) => {
    const id = Number(chatId);
    if (Number.isInteger(id)) void socket.leave(`chat:${id}`);
  });
});

// One LISTEN connection per live instance — every instance relays every
// event to its own room members, so cross-instance delivery just works.
let listenerStarted = false;
function startListener() {
  listenerStarted = true;
  const listener = new Client({ connectionString: DB_UNPOOLED });
  listener.on("error", (err) => {
    console.error("[listener] error — reconnecting", err.message);
    setTimeout(startListener, 2000);
  });
  listener.on("notification", (msg) => {
    if (!msg.payload) return;
    try {
      const event = JSON.parse(msg.payload) as {
        kind: "message" | "state";
        chatId: number;
      };
      io.to(`chat:${event.chatId}`).emit(event.kind, event);
    } catch (err) {
      console.error("[listener] bad payload", err);
    }
  });
  listener
    .connect()
    .then(() => listener.query("LISTEN chat_events"))
    .then(() => console.log("[realtime] LISTENing on chat_events"))
    .catch((err) => {
      console.error("[listener] connect failed — retrying", err.message);
      setTimeout(startListener, 2000);
    });
}
// Start lazily on first connection so an idle deploy holds no DB session.
io.on("connection", () => {
  if (!listenerStarted) startListener();
});

export default httpServer;
