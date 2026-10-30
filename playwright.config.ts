// QA suite: 4 viewports × Chromium/WebKit, reduced motion, retries on CI.
// Runs against an already-running build (QA_BASE_URL, default :3100) and a
// disposable database (QA_DATABASE_URL) — see tests/README.md.

import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, VIEWPORTS } from "./tests/support/env";

const projects = (["chromium", "webkit"] as const).flatMap((browser) =>
  VIEWPORTS.map((vp) => ({
    name: `${browser}-${vp.name}`,
    use: {
      ...(browser === "chromium" ? devices["Desktop Chrome"] : devices["Desktop Safari"]),
      viewport: { width: vp.width, height: vp.height },
      isMobile: false,
      hasTouch: false,
    },
  })),
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "artifacts/playwright/results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    reducedMotion: "reduce",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects,
});
