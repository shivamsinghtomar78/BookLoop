import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" }, // seed placeholders
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "*.ufs.sh" }, // UploadThing
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  /* config options here */
};

export default nextConfig;
