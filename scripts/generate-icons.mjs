import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ICONS_DIR = join(process.cwd(), "public", "icons");
const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#b5e930" rx="96"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold" text-anchor="middle" fill="#013425">S</text>
</svg>`;

if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(join(ICONS_DIR, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Maskable icon with safe zone padding
  await sharp(Buffer.from(SVG))
    .resize(512, 512, { fit: "contain", background: { r: 181, g: 233, b: 48, alpha: 1 } })
    .png()
    .toFile(join(ICONS_DIR, "maskable-icon-512x512.png"));
  console.log("Generated maskable-icon-512x512.png");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
