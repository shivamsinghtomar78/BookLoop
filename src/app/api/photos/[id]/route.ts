// Serves photo_blobs bytes. IDs are random UUIDs and never change, so the
// response is immutable and cacheable by the browser, Next Image and the CDN.

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { photoBlobs } from "@/db/schema";
import { ensurePhotoBlobTable } from "@/db/ensure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  try {
    await ensurePhotoBlobTable();
    const [row] = await getDb()
      .select({ mime: photoBlobs.mime, data: photoBlobs.data })
      .from(photoBlobs)
      .where(eq(photoBlobs.id, id))
      .limit(1);

    if (!row) return new Response("Not found", { status: 404 });

    const bytes = Buffer.from(row.data, "base64");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ETag: `"${id}"`,
      },
    });
  } catch (err) {
    console.error("[photos] read failed", err);
    return new Response("Photo unavailable", { status: 500 });
  }
}
