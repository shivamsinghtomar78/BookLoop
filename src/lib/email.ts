// Shared email sender — Resend when RESEND_API_KEY is set, console fallback in dev.
// Email is ALWAYS best-effort (ARCHITECTURE.md rule 6): failures log, never throw.

import { Resend } from "resend";

const FROM = "BookLoop <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email dev-fallback] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  try {
    await new Resend(key).emails.send({ from: FROM, to, subject, text });
  } catch (err) {
    console.error("[email] send failed", { to, subject, err });
  }
}
