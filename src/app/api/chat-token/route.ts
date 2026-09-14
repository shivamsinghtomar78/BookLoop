// Mints a short-lived JWT for the socket.io handshake (D-055). The socket
// server verifies it with the shared CHAT_JWT_SECRET; per-chat authorization
// is re-checked against the DB on every room join.

import { SignJWT } from "jose";
import { getCurrentUser } from "@/services/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return Response.json({ error: "unauthorized" }, { status: 401 });

  const secret = process.env.CHAT_JWT_SECRET;
  if (!secret) return Response.json({ error: "realtime disabled" }, { status: 503 });

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(current.profile.id))
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));

  // Where the socket.io server lives (D-060):
  // - explicit NEXT_PUBLIC_REALTIME_URL override wins (external host)
  // - on Vercel: same origin, served by the api/socketio.ts function
  // - local dev: the standalone realtime/server.ts on :4001
  const target = process.env.NEXT_PUBLIC_REALTIME_URL
    ? { url: process.env.NEXT_PUBLIC_REALTIME_URL, path: "/socket.io" }
    : process.env.VERCEL
      ? { url: "", path: "/api/socketio/socket.io" } // "" = same origin
      : { url: "http://localhost:4001", path: "/socket.io" };

  return Response.json({ token, ...target });
}
