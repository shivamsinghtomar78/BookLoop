// UploadThing file router (Task 2.1) — photos go client → UploadThing directly,
// never through our functions (ARCHITECTURE.md rule 5). Auth checked here.

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentUser } from "@/services/users";
import { LIMITS } from "@/lib/constants";

const f = createUploadthing();

export const uploadRouter = {
  bookPhotos: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: LIMITS.maxPhotosPerListing,
    },
  })
    .middleware(async () => {
      const current = await getCurrentUser();
      if (!current) throw new UploadThingError("Sign in to add photos");
      return { userId: current.profile.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[uploadthing] photo uploaded", {
        userId: metadata.userId,
        url: file.ufsUrl,
      });
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
