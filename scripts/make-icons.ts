// Generates the PWA icons from an original BookLoop mark (loop-green rounded
// square, white open book). Run once: npx tsx scripts/make-icons.ts

import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Original mark: rounded green square + simple open-book glyph.
// Glyph kept inside the central 70% so the maskable variant is safe.
const svg = (size: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0E9F6E"/>
  <g fill="none" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <!-- open book: two pages meeting at a spine -->
    <path d="M256 176 C 216 150, 152 150, 120 168 L 120 344 C 152 326, 216 326, 256 352 Z" fill="#FFFFFF" stroke="none"/>
    <path d="M256 176 C 296 150, 360 150, 392 168 L 392 344 C 360 326, 296 326, 256 352 Z" fill="#DEF7EC" stroke="none"/>
    <line x1="256" y1="176" x2="256" y2="352" stroke="#0E9F6E" stroke-width="10"/>
  </g>
</svg>`;

async function main() {
  mkdirSync("public/icons", { recursive: true });
  for (const size of [192, 512]) {
    await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}.png`);
    console.log(`icon-${size}.png ✓`);
  }
  // Apple touch icon (180px, no transparency needed — bg is solid already)
  await sharp(Buffer.from(svg(180)))
    .resize(180, 180)
    .png()
    .toFile("public/icons/apple-touch-icon.png");
  console.log("apple-touch-icon.png ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
