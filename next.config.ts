import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" }, // seed placeholders
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  /* config options here */
};

export default nextConfig;
