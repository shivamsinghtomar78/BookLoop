// Read-only QA baseline against a running BookLoop deployment.
// Navigates public pages at four viewports in Chromium and WebKit, captures
// screenshots, console/network failures, Core Web Vitals and axe results.
// Makes no writes and signs in as nobody.
//
// Usage: node scripts/qa-baseline.mjs [--browser=chromium|webkit|both] [--base=URL]

import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, webkit } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);

const BASE =
  args.base ??
  process.env.QA_BASE_URL ??
  "https://prod-main-web-562200-00kmxv63sn6.compute.instacloud-edge.com";
const OUT = path.resolve(args.out ?? "artifacts/baseline");
const BROWSERS = args.browser === "both" ? ["chromium", "webkit"] : [args.browser ?? "chromium"];

const VIEWPORTS = [
  { name: "360x640", width: 360, height: 640 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];

const PAGES = [
  { slug: "home", path: "/", axe: true, full: true },
  { slug: "search", path: "/search", axe: true, full: true },
  { slug: "search-filtered", path: "/search?q=science&class=9", full: true },
  { slug: "exchange", path: "/exchange", full: true },
  { slug: "donate", path: "/donate", axe: true, full: true },
  { slug: "listing-detail", path: "/listings/12", axe: true, full: true },
  { slug: "listing-missing", path: "/listings/999999", full: false },
  { slug: "chats-guest", path: "/chats", full: false },
  { slug: "sell-guest", path: "/sell", full: false },
  { slug: "privacy", path: "/privacy", full: false },
  { slug: "terms", path: "/terms", full: false },
];

const VITALS_INIT = () => {
  window.__qa = { lcp: 0, cls: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__qa.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__qa.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    /* unsupported */
  }
};

const results = [];

async function runPage(browserType, browserName, viewport, spec) {
  const context = await browserType.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 300)));
  page.on("requestfailed", (req) =>
    failedRequests.push(`${req.method()} ${req.url().slice(0, 140)} — ${req.failure()?.errorText ?? "?"}`),
  );

  await page.addInitScript(VITALS_INIT);
  const started = Date.now();
  let status = 0;
  let navError = null;
  try {
    const res = await page.goto(BASE + spec.path, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = res?.status() ?? 0;
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  } catch (err) {
    navError = err.message.split("\n")[0];
  }
  await page.waitForTimeout(900);

  const url = page.url();
  const title = await page.title().catch(() => "");
  const vitals = await page.evaluate(() => window.__qa ?? { lcp: 0, cls: 0 }).catch(() => ({ lcp: 0, cls: 0 }));
  const dir = path.join(OUT, browserName, viewport.name);
  mkdirSync(dir, { recursive: true });
  await page
    .screenshot({
      path: path.join(dir, `${spec.slug}${spec.full ? "-full" : ""}.png`),
      fullPage: spec.full,
    })
    .catch(() => {});

  let axe = null;
  if (spec.axe) {
    try {
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      axe = scan.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        samples: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
      }));
    } catch (err) {
      axe = [{ id: "axe-failed", impact: "unknown", help: String(err).slice(0, 200), nodes: 0, samples: [] }];
    }
  }

  results.push({
    browser: browserName,
    viewport: viewport.name,
    slug: spec.slug,
    requested: spec.path,
    finalUrl: url.replace(BASE, ""),
    status,
    title,
    ms: Date.now() - started,
    lcp: Math.round(vitals.lcp),
    cls: Number(vitals.cls.toFixed(3)),
    consoleErrors,
    pageErrors,
    failedRequests,
    navError,
    axe,
  });

  await context.close();
}

function markdown() {
  const ok = (r) => !r.navError && r.status >= 200 && r.status < 400;
  const lines = [];
  lines.push(`# BookLoop — QA baseline (read-only)`);
  lines.push("");
  lines.push(`- Base: ${BASE}`);
  lines.push(`- Captured: ${new Date().toISOString()}`);
  lines.push(`- Browsers: ${BROWSERS.join(", ")} · viewports: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
  lines.push("");
  lines.push("## Page health");
  lines.push("");
  lines.push("| Browser | Viewport | Page | HTTP | Final URL | LCP (ms) | CLS | Console errors | Failed requests |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    lines.push(
      `| ${r.browser} | ${r.viewport} | ${r.slug} | ${r.status || (r.navError ? "ERR" : "?")} | ${r.finalUrl || "—"} | ${r.lcp || "—"} | ${r.cls} | ${r.consoleErrors.length} | ${r.failedRequests.length} |`,
    );
  }
  lines.push("");
  lines.push("## Accessibility violations (axe, WCAG 2.1 AA)");
  const byId = new Map();
  for (const r of results) {
    for (const v of r.axe ?? []) {
      const key = v.id;
      const entry = byId.get(key) ?? { ...v, pages: new Set() };
      entry.nodes = Math.max(entry.nodes, v.nodes);
      entry.pages.add(`${r.browser}/${r.viewport}/${r.slug}`);
      byId.set(key, entry);
    }
  }
  if (byId.size === 0) lines.push("\nNone found.");
  else {
    lines.push("");
    lines.push("| Rule | Impact | Nodes | Pages affected | Sample targets |");
    lines.push("|---|---|---|---|---|");
    for (const v of [...byId.values()].sort((a, b) => a.impact.localeCompare(b.impact))) {
      lines.push(
        `| ${v.id} — ${v.help} | ${v.impact} | ${v.nodes} | ${v.pages.size} | ${v.samples.map((s) => `\`${s}\``).join(", ") || "—"} |`,
      );
    }
  }
  lines.push("");
  lines.push("## Failures that need a look");
  const failures = results.filter((r) => !ok(r) || r.consoleErrors.length || r.pageErrors.length || r.failedRequests.length);
  if (failures.length === 0) lines.push("\nNone.");
  for (const r of failures) {
    lines.push(`\n### ${r.browser} · ${r.viewport} · ${r.slug} (HTTP ${r.status})`);
    if (r.navError) lines.push(`- navigation: ${r.navError}`);
    for (const e of r.pageErrors) lines.push(`- pageerror: ${e}`);
    for (const e of r.consoleErrors) lines.push(`- console: ${e}`);
    for (const e of r.failedRequests) lines.push(`- request: ${e}`);
  }
  return lines.join("\n");
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const browserName of BROWSERS) {
    const launcher = { chromium, webkit }[browserName];
    const executablePath = launcher.executablePath();
    console.log(`\n${browserName}: ${executablePath}`);
    const browser = await launcher.launch({ executablePath, headless: true });
    for (const viewport of VIEWPORTS) {
      for (const spec of PAGES) {
        process.stdout.write(`  ${viewport.name} ${spec.slug} … `);
        try {
          await runPage(browser, browserName, viewport, spec);
          const r = results.at(-1);
          console.log(`${r.status || "ERR"} ${r.lcp}ms cls=${r.cls} axe=${r.axe?.length ?? "—"}`);
        } catch (err) {
          console.log(`FAILED: ${err.message.split("\n")[0]}`);
          results.push({
            browser: browserName,
            viewport: viewport.name,
            slug: spec.slug,
            requested: spec.path,
            finalUrl: "",
            status: 0,
            title: "",
            ms: 0,
            lcp: 0,
            cls: 0,
            consoleErrors: [],
            pageErrors: [],
            failedRequests: [],
            navError: err.message.split("\n")[0],
            axe: null,
          });
        }
      }
    }
    await browser.close();
  }
  await writeFile(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
  await writeFile(path.join(OUT, "report.md"), markdown());
  console.log(`\nWrote ${path.join(OUT, "report.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
