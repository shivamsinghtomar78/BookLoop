// Route guard (Task 1.5) — Next 16 proxy (middleware's successor).
// Optimistic cookie check only; real authorization happens in services.

import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    // Guests reach these only through the auth sheet — direct URLs bounce home.
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/sell", "/chats/:path*"],
};
