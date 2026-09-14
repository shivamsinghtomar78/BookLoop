import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }, // seed/demo book photos (verified pool, seed-photos.ts)
      { protocol: "https", hostname: "picsum.photos" }, // legacy placeholders (until all rows reseeded)
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "*.ufs.sh" }, // UploadThing
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  /* config options here */
};

export default nextConfig;
