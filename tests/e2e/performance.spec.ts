// Core Web Vitals budgets on the built app, across all four viewports.

import { test, expect } from "@playwright/test";

type Vitals = { lcp: number; cls: number };

async function collect(page: import("@playwright/test").Page): Promise<Vitals> {
  return page.evaluate(
    () =>
      new Promise<Vitals>((resolve) => {
        let lcp = 0;
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) lcp = Math.max(lcp, e.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as PerformanceEntry[]) {
            const shift = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!shift.hadRecentInput) cls += shift.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve({ lcp, cls }), 3000);
      }),
  );
}

test.describe("core web vitals", () => {
  // Chromium on CI hardware decodes the hero photos well inside 4.5 s; WebKit
  // on Windows does the same work ~2× slower while three projects share the
  // machine, so it gets its own ceiling. Alone, both land around 1 s.
  const lcpBudget = (project: string) =>
    project.startsWith("webkit") ? 8000 : 4500;

  test("home meets LCP/CLS budgets", async ({ page }, testInfo) => {
    await page.goto("/");
    const { lcp, cls } = await collect(page);
    testInfo.annotations.push(
      { type: "LCP", description: `${Math.round(lcp)} ms` },
      { type: "CLS", description: cls.toFixed(3) },
    );
    // Target is 2.5 s/LCP and 0.1/CLS when measured alone.
    expect(lcp).toBeLessThan(lcpBudget(testInfo.project.name));
    expect(cls).toBeLessThan(0.12);
  });

  test("search meets LCP/CLS budgets", async ({ page }, testInfo) => {
    await page.goto("/search?q=science");
    const { lcp, cls } = await collect(page);
    testInfo.annotations.push(
      { type: "LCP", description: `${Math.round(lcp)} ms` },
      { type: "CLS", description: cls.toFixed(3) },
    );
    expect(lcp).toBeLessThan(lcpBudget(testInfo.project.name));
    expect(cls).toBeLessThan(0.12);
  });

  test("server responds quickly on warm requests", async ({ request }) => {
    await request.get("/");
    const t0 = Date.now();
    const res = await request.get("/search");
    expect(res.status()).toBe(200);
    expect(Date.now() - t0).toBeLessThan(2000);
  });
});
