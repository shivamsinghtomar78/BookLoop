// One place for the public-facing facts that appear in policies and metadata.

export const SITE_NAME = "BookLoop";
export const SITE_TAGLINE = "Buy, sell, exchange and donate school books";

/** Optional until the pilot school sets an inbox — the in-app reporter works regardless. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null;

export function supportContact(): string {
  return SUPPORT_EMAIL ?? "the “Report a problem” link on your profile";
}
