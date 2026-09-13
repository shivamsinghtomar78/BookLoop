// BookLoop realtime server (D-055) — socket.io on a plain Node HTTP server.
// PUSH-ONLY by design: all writes go through the Next.js server actions
// (one place for validation, rate limits, notifications); each write fires
// pg_notify('chat_events', …) and this server relays it to the right room.
//
// Run: npm run realtime   (needs DATABASE_URL_UNPOOLED + CHAT_JWT_SECRET)
// Host anywhere Node runs (Render/Railway/…); Vercel can't host it — the
// chat UI falls back to REST polling when this server is unreachable.

import { createServer } from "node:http";
import { Server } from "socket.io";
import { Client, Pool } from "pg";
import { jwtVerify } from "jose";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const PORT = Number(process.env.REALTIME_PORT ?? 4001);
const SECRET = process.env.CHAT_JWT_SECRET;
const DB_UNPOOLED = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const APP_ORIGIN = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

if (!SECRET || !DB_UNPOOLED) {
  console.error("CHAT_JWT_SECRET and DATABASE_URL(_UNPOOLED) are required");
  process.exit(1);
}
const secretKey = new TextEncoder().encode(SECRET);

// Pool for participant checks (pooled URL is fine for these)
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

const httpServer = createServer((_, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "bookloop-realtime" }));
});

const io = new Server(httpServer, {
  cors: { origin: [APP_ORIGIN], methods: ["GET", "POST"] },
});

// Auth middleware: short-lived JWT minted by the app (/api/chat-token)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    const { payload } = await jwtVerify(token, secretKey);
    socket.data.userId = Number(payload.sub);
    if (!Number.isInteger(socket.data.userId)) return next(new Error("unauthorized"));
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  // Join a chat room only after a fresh participant check against the DB.
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

// LISTEN chat_events on a dedicated DIRECT connection (this is a persistent
// process — unlike serverless, holding a LISTEN session here is fine).
function startListener() {
  const listener = new Client({ connectionString: DB_UNPOOLED });
  listener.on("error", (err) => {
    console.error("[listener] connection error — reconnecting", err.message);
    setTimeout(startListener, 2000);
  });
  listener.on("notification", (msg) => {
    if (!msg.payload) return;
    try {
      const event = JSON.parse(msg.payload) as {
        kind: "message" | "state";
        chatId: number;
        message?: unknown;
      };
      io.to(`chat:${event.chatId}`).emit(event.kind, event);
    } catch (err) {
      console.error("[listener] bad payload", err);
    }
  });
  listener
    .connect()
    .then(() => listener.query("LISTEN chat_events"))
    .then(() => console.log("LISTENing on chat_events"))
    .catch((err) => {
      console.error("[listener] connect failed — retrying", err.message);
      setTimeout(startListener, 2000);
    });
}
startListener();

httpServer.listen(PORT, () => {
  console.log(`bookloop-realtime on :${PORT} (origin: ${APP_ORIGIN})`);
});
