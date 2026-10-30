// Focused axe scan with node-level detail. Usage:
//   node scripts/qa-axe.mjs --url=/ --viewport=390x844
//   node scripts/qa-axe.mjs --url=/search --browser=webkit

import { chromium, webkit } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const BASE = args.base ?? process.env.QA_BASE_URL ?? "http://localhost:3100";
const TARGET = args.url ?? "/";
const [w, h] = (args.viewport ?? "390x844").split("x").map(Number);
const launcher = args.browser === "webkit" ? webkit : chromium;
const OUT = path.resolve("artifacts/axe");
const slug = (args.browser ?? "chromium") + "-" + TARGET.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") + "-" + w + "x" + h;

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await launcher.launch({ executablePath: launcher.executablePath(), headless: true });
  const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(BASE + TARGET, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const report = scan.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      html: n.html.slice(0, 300),
      summary: n.failureSummary,
      any: n.any.map((a) => a.message),
    })),
  }));

  await writeFile(`${OUT}/${slug}.json`, JSON.stringify(report, null, 2));
  await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: true });

  console.log(`\n${BASE}${TARGET} @ ${w}x${h} — ${report.length} violation(s)`);
  for (const v of report) {
    console.log(`\n[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
    for (const n of v.nodes.slice(0, 12)) {
      console.log(`  • ${n.target.join(" ")}`);
      console.log(`    ${n.html.replace(/\s+/g, " ")}`);
      console.log(`    ${(n.summary ?? "").replace(/\n/g, " ")}`);
    }
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
