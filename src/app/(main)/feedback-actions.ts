"use server";

// Feedback action (Task 6.8) — works for guests too (userId null).

import { z } from "zod";
import { getDb } from "@/db/client";
import { feedback } from "@/db/schema";
import { getCurrentUser } from "@/services/users";
import { sendEmail } from "@/lib/email";

const bodySchema = z.string().trim().min(5, "Tell us a little more").max(1000);

export async function reportProblemAction(
  rawBody: unknown,
  page?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };

  try {
    const current = await getCurrentUser();
    await getDb().insert(feedback).values({
      userId: current?.profile.id ?? null,
      body: parsed.data,
      page: page?.slice(0, 200) ?? null,
    });

    // Best-effort heads-up to the team inbox when configured
    const teamInbox = process.env.TEAM_INBOX_EMAIL;
    if (teamInbox) {
      void sendEmail(
        teamInbox,
        "BookLoop: new problem report",
        `From: ${current?.profile.fullName ?? "guest"}\nPage: ${page ?? "?"}\n\n${parsed.data}`,
      );
    }
    return { ok: true };
  } catch (err) {
    console.error("[feedback]", err);
    return { ok: false, error: "Couldn't send it. Please try again." };
  }
}
