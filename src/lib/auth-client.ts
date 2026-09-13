// Client-side auth — session reads in client components (useSession).
// Writes (signup/login/logout) go through server actions, per ARCHITECTURE.md §3.2.
"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { useSession } = authClient;
