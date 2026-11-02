import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const BASE = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Listings and chats are school-only surfaces; keep them out of search.
        disallow: [
          "/api/",
          "/search",
          "/listings/",
          "/chats",
          "/profile",
          "/sell",
          "/notifications",
          "/admin",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
