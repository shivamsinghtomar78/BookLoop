"use client";

// Photo-first uploader (Task 2.1/2.2): camera/gallery picker, direct upload
// to UploadThing, thumbnails with remove. First photo is the cover.

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("bookPhotos", {
    onClientUploadComplete: (res) => {
      onChange([...photos, ...res.map((f) => f.ufsUrl)].slice(0, LIMITS.maxPhotosPerListing));
      setUploading(false);
    },
    onUploadError: (e) => {
      setUploading(false);
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
    await startUpload(selected);
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
            {uploading ? "Uploading…" : photos.length === 0 ? "Add photos" : "Add more"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-subtle mt-1 text-xs">
        1–4 photos, 4MB each. Tip: place the book on a plain table — the photo is
        the listing.
      </p>
    </div>
  );
}
