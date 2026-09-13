// PWA manifest (Task 6.1, D-027) — makes BookLoop installable to the home screen.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BookLoop",
    short_name: "BookLoop",
    description:
      "Give your books a second life — buy, sell, exchange and donate school books.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#0e9f6e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
