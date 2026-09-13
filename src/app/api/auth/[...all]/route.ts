// Better Auth handler — all /api/auth/* endpoints (sign-in, sign-up, verify-email…)
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
