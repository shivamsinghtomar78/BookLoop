// Zero-config photo upload (fallback when UploadThing is not configured).
// Receives up to 4 images, normalises them to WebP with sharp, stores them in
// Postgres, and returns stable /api/photos/<id> URLs.

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { photoBlobs } from "@/db/schema";
import { ensurePhotoBlobTable } from "@/db/ensure";
import { getCurrentUser } from "@/services/users";
import { LIMITS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_BYTES = 4 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1_200_000;
// Abuse ceiling per student; the QA stack raises it so repeated suite runs
// (each publishing a book) don't exhaust one seeded account's quota.
const MAX_PER_DAY = Number(process.env.PHOTO_DAILY_LIMIT) || 40;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  // Same-origin guard: compare the Origin host with every host we can be
  // reached under. Managed platforms terminate TLS and rewrite Host, so the
  // request host alone is not enough — the configured public URL must count.
  const origin = req.headers.get("origin");
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const hosts = new Set<string>();
    for (const h of [
      req.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
      req.headers.get("host"),
    ]) {
      if (h) hosts.add(h);
    }
    try {
      if (process.env.BETTER_AUTH_URL) hosts.add(new URL(process.env.BETTER_AUTH_URL).host);
      for (const o of (process.env.APP_ORIGINS ?? "").split(",")) {
        if (o.trim()) hosts.add(new URL(o.trim()).host);
      }
    } catch {
      /* malformed config — fall back to the request hosts above */
    }
    if (!hosts.has(originHost)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const current = await getCurrentUser();
  if (!current) {
    return Response.json({ error: "Sign in to add photos" }, { status: 401 });
  }
  const profile = current.profile;

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_INPUT_BYTES * LIMITS.maxPhotosPerListing + 1024 * 1024) {
    return Response.json({ error: "Photos are too large — pick smaller images" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Couldn't read the photos — try again" }, { status: 400 });
  }

  const files = form.getAll("photos").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return Response.json({ error: "No photos received" }, { status: 400 });
  }
  if (files.length > LIMITS.maxPhotosPerListing) {
    return Response.json(
      { error: `Maximum ${LIMITS.maxPhotosPerListing} photos` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!ACCEPTED.has(file.type)) {
      return Response.json({ error: "Use JPG, PNG or WebP photos" }, { status: 415 });
    }
    if (file.size > MAX_INPUT_BYTES) {
      return Response.json({ error: "Each photo must be under 4MB" }, { status: 413 });
    }
  }

  try {
    await ensurePhotoBlobTable();
    const db = getDb();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(photoBlobs)
      .where(and(eq(photoBlobs.ownerId, profile.id), gte(photoBlobs.createdAt, since)));
    if (count + files.length > MAX_PER_DAY) {
      return Response.json(
        { error: "Daily photo limit reached — try again tomorrow" },
        { status: 429 },
      );
    }

    const rows = [];
    for (const file of files) {
      const input = Buffer.from(await file.arrayBuffer());
      const webp = await sharp(input, { failOn: "none" })
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 74 })
        .toBuffer({ resolveWithObject: true });

      if (webp.data.length > MAX_OUTPUT_BYTES) {
        return Response.json({ error: "Photo is too detailed — try a simpler shot" }, { status: 413 });
      }

      const id = randomUUID();
      rows.push({
        id,
        ownerId: profile.id,
        mime: "image/webp",
        data: webp.data.toString("base64"),
        width: webp.info.width,
        height: webp.info.height,
      });
    }

    await db.insert(photoBlobs).values(
      rows.map(({ id, ownerId, mime, data }) => ({ id, ownerId, mime, data })),
    );

    return Response.json({
      photos: rows.map((r) => ({ url: `/api/photos/${r.id}`, width: r.width, height: r.height })),
    });
  } catch (err) {
    console.error("[photos] upload failed", err);
    return Response.json({ error: "Couldn't save the photos — try again" }, { status: 500 });
  }
}
