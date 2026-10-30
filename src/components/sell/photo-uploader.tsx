"use client";

// Photo-first uploader (Task 2.1/2.2): camera/gallery picker, thumbnails with
// remove, first photo is the cover. Uses UploadThing when a token is
// configured; otherwise falls back to the built-in /api/photos endpoint so
// publishing always works.

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { shrinkImage } from "@/lib/image-client";
import { LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type UploadMode = "uploadthing" | "local";

function postPhotos(files: File[], onProgress: (pct: number) => void): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    for (const file of files) body.append("photos", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as {
          photos?: { url: string }[];
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && json.photos) {
          onProgress(100);
          resolve(json.photos.map((p) => p.url));
        } else {
          reject(new Error(json.error ?? "Upload failed — try again"));
        }
      } catch {
        reject(new Error("Upload failed — try again"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection and try again"));
    xhr.send(body);
  });
}

async function uploadLocal(files: File[], onProgress: (pct: number) => void) {
  try {
    return await postPhotos(files, onProgress);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Network error")) {
      await new Promise((r) => setTimeout(r, 800));
      return postPhotos(files, onProgress);
    }
    throw err;
  }
}

export function PhotoUploader({
  photos,
  onChange,
  mode = "uploadthing",
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  mode?: UploadMode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { startUpload } = useUploadThing("bookPhotos", {
    onClientUploadComplete: (res) => {
      onChange([...photos, ...res.map((f) => f.ufsUrl)].slice(0, LIMITS.maxPhotosPerListing));
      setUploading(false);
      setProgress(0);
    },
    onUploadError: (e) => {
      setUploading(false);
      setProgress(0);
      toast.error(e.message || "Upload failed — try again");
    },
  });

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = LIMITS.maxPhotosPerListing - photos.length;
    const selected = Array.from(files).slice(0, room);
    if (selected.length === 0) {
      toast.error(`Maximum ${LIMITS.maxPhotosPerListing} photos`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      if (mode === "local") {
        const prepared = await Promise.all(selected.map((f) => shrinkImage(f)));
        const urls = await uploadLocal(prepared, setProgress);
        onChange([...photos, ...urls].slice(0, LIMITS.maxPhotosPerListing));
      } else {
        await startUpload(selected);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed — try again");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((url, i) => (
          <div
            key={url}
            className="bg-surface-soft relative size-20 shrink-0 overflow-hidden rounded-lg"
          >
            <Image src={url} alt={`Photo ${i + 1}`} fill sizes="80px" className="object-cover" />
            {i === 0 && (
              <span className="bg-primary text-primary-foreground absolute bottom-0 inset-x-0 py-0.5 text-center text-[9px] font-medium">
                COVER
              </span>
            )}
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => onChange(photos.filter((p) => p !== url))}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {photos.length < LIMITS.maxPhotosPerListing && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "border-hairline text-subtle flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-[11px]",
              uploading && "animate-pulse",
            )}
          >
            <Camera className="size-5" />
            {uploading
              ? progress > 0
                ? `${progress}%`
                : "Uploading…"
              : photos.length === 0
                ? "Add photos"
                : "Add more"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-subtle mt-1 text-xs">
        1–4 photos, 4MB each. Photos are compressed automatically. Tip: place the
        book on a plain table — the photo is the listing.
      </p>
    </div>
  );
}
