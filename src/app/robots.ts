import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000";

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
