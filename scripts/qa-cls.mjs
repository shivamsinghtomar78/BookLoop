// Diagnose layout shifts: prints each shift's value and the moved elements.
// Usage: node scripts/qa-cls.mjs --url=/search --viewport=390x844

import { chromium } from "playwright-core";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=") || true];
  }),
);
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3100";
const TARGET = args.url ?? "/";
const [w, h] = String(args.viewport ?? "390x844").split("x").map(Number);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: w, height: h } });

await page.addInitScript(() => {
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      window.__shifts.push({
        value: entry.value,
        time: Math.round(entry.startTime),
        sources: (entry.sources ?? []).map((s) => ({
          node: s.node
            ? `${s.node.nodeName.toLowerCase()}${s.node.id ? "#" + s.node.id : ""}.${
                (s.node.className || "").toString().split(" ").slice(0, 3).join(".")
              }`
            : "(detached)",
          prev: s.previousRect
            ? `${Math.round(s.previousRect.x)},${Math.round(s.previousRect.y)} ${Math.round(s.previousRect.width)}x${Math.round(s.previousRect.height)}`
            : null,
          next: s.currentRect
            ? `${Math.round(s.currentRect.x)},${Math.round(s.currentRect.y)} ${Math.round(s.currentRect.width)}x${Math.round(s.currentRect.height)}`
            : null,
        })),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
});

await page.goto(BASE + TARGET, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(4000);
const shifts = await page.evaluate(() => window.__shifts);
const total = shifts.reduce((sum, s) => sum + s.value, 0);
console.log(`${TARGET} @ ${w}x${h} — CLS ${total.toFixed(4)} over ${shifts.length} shift(s)`);
for (const s of shifts) {
  console.log(`  +${s.value.toFixed(4)} @${s.time}ms`);
  for (const src of s.sources) {
    console.log(`     ${src.node}  ${src.prev} -> ${src.next}`);
  }
}
await browser.close();
