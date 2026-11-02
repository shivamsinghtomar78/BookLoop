// Mints a short-lived JWT for the socket.io handshake (D-055). The socket
// server verifies it with the shared CHAT_JWT_SECRET; per-chat authorization
// is re-checked against the DB on every room join.

import { SignJWT } from "jose";
import { getCurrentUser } from "@/services/users";

export const dynamic = "force-dynamic";

export async function GET() {
  // Where the socket.io server lives (D-062):
  // - explicit NEXT_PUBLIC_REALTIME_URL wins (always-on external host)
  // - local dev: the standalone realtime/server.ts on :4001
  // - on Vercel: disabled — a serverless function can't safely hold a
  //   Postgres LISTEN (frozen instances leak connections). The chat UI
  //   falls back to REST polling, which uses stateless HTTP queries.
  const external = process.env.NEXT_PUBLIC_REALTIME_URL;
  if (!external && process.env.VERCEL) {
    return Response.json({ error: "realtime disabled" }, { status: 503 });
  }

  const current = await getCurrentUser();
  if (!current) return Response.json({ error: "unauthorized" }, { status: 401 });

  const secret = process.env.CHAT_JWT_SECRET;
  if (!secret) return Response.json({ error: "realtime disabled" }, { status: 503 });

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(current.profile.id))
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));

  const target = external
    ? { url: external, path: "/socket.io" }
    : { url: "http://localhost:4001", path: "/socket.io" };

  return Response.json({ token, ...target });
}
