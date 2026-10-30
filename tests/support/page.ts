// Page helpers: the app renders static HTML first, so tests that click must
// wait for React to hydrate (the marker is set by HydrationMarker).

import type { Page } from "@playwright/test";

export async function waitHydrated(page: Page, timeout = 15_000) {
  await page.waitForFunction(
    () => document.documentElement.dataset.hydrated === "1",
    undefined,
    { timeout },
  );
}

export async function gotoHydrated(page: Page, path: string) {
  const res = await page.goto(path);
  await waitHydrated(page);
  return res;
}
