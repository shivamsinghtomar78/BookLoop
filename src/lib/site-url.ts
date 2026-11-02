// Canonical public origin for metadata, sitemap and robots. Vercel exposes
// the production host without a scheme; a stale localhost BETTER_AUTH_URL
// must not leak into share cards when the deployment itself knows its URL.

const trim = (url: string) => url.replace(/\/+$/, "");

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return trim(explicit);

  const auth = process.env.BETTER_AUTH_URL;
  if (auth && !/^https?:\/\/localhost(:\d+)?$/i.test(auth)) return trim(auth);

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${trim(vercel)}`;

  return auth ? trim(auth) : "http://localhost:3000";
}
