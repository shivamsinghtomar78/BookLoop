// Resolve a Chromium binary without hardcoding a machine-specific path.
// The Playwright cache may hold a build newer or older than the installed
// playwright-core, so fall back to scanning ms-playwright revisions.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

function cacheRoot() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  }
  if (process.platform === "darwin") return join(process.env.HOME ?? "", "Library/Caches/ms-playwright");
  return join(process.env.HOME ?? "", ".cache/ms-playwright");
}

function revision(dir) {
  return Number(dir.match(/-(\d+)$/)?.[1] ?? 0);
}

function newestExecutable(root, dirPattern, relative) {
  if (!existsSync(root)) return null;
  const dirs = readdirSync(root)
    .filter((d) => dirPattern.test(d))
    .sort((a, b) => revision(b) - revision(a));
  for (const dir of dirs) {
    const candidate = join(root, dir, relative);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Absolute path to a usable Chromium build, or null. */
export function resolveChromiumExecutable() {
  if (process.env.E2E_CHROME && existsSync(process.env.E2E_CHROME)) {
    return process.env.E2E_CHROME;
  }

  try {
    const expected = chromium.executablePath();
    if (expected && existsSync(expected)) return expected;
  } catch {
    // No installed revision matching this playwright-core.
  }

  const root = cacheRoot();
  return (
    newestExecutable(root, /^chromium_headless_shell-\d+$/, join("chrome-headless-shell-win64", "chrome-headless-shell.exe")) ??
    newestExecutable(root, /^chromium-\d+$/, join("chrome-win64", "chrome.exe"))
  );
}
