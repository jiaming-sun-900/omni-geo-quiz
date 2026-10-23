// Builds the two images a link or a home screen shows for the site:
//   public/og.png               1200x630 link preview (Open Graph / Twitter)
//   public/apple-touch-icon.png 180x180 iOS home-screen icon
// The globe is the favicon's (scripts/build-favicon.js): the same world-atlas
// land, the globe texture's three colours and the hard offset shadow, drawn
// at a size where the coastline can show.
//
// Link previews need a raster image (most crawlers ignore SVG), so the SVGs
// are rendered with Playwright. It is not a project dependency, since this runs
// rarely; to regenerate: `npm i --no-save playwright && npx playwright install
// chromium`, then `node scripts/build-share-images.js`.

import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const land = feature(...((t) => [t, t.objects.land])(require("world-atlas/land-50m.json")));

const OCEAN = "#4A90B8";
const LAND = "#EDE0C8";
const COAST = "#3D2B1F";
const INK = "#111";
const PAPER = "#FAF7F4";
const ORANGE = "#FF4F00";

// A globe of radius r centred at (cx, cy), Atlantic view as in the favicon,
// with the design system's hard shadow `shadow` units down-right.
function globe(cx, cy, r, shadow, outline) {
  const projection = geoOrthographic().rotate([25, -18]).translate([cx, cy]).scale(r).clipAngle(90);
  const path = geoPath(projection).digits(1);
  return `
  <circle cx="${cx + shadow}" cy="${cy + shadow}" r="${r}" fill="${INK}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${OCEAN}"/>
  <path d="${path(land)}" fill="${LAND}" stroke="${COAST}" stroke-width="${r / 450}" stroke-linejoin="round"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="${outline}"/>`;
}

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const MONO = `"Courier New", Courier, monospace`;

// The preview: title and tagline on the left, the Daily Challenge badge and a
// share grid under them, the globe bleeding off the right edge. The text has
// to end before the globe starts (x = 770): at the first try it ran under it.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  ${globe(1035, 330, 265, 12, 7)}
  <text x="80" y="250" font-family='${FONT}' font-size="82" font-weight="800" fill="#1a1a2e">Omni Geo Quiz</text>
  <text x="84" y="316" font-family='${FONT}' font-size="33" fill="#1a1a2e">Name cities and airports from above.</text>
  <rect x="84" y="392" width="300" height="50" rx="8" fill="${ORANGE}" stroke="${INK}" stroke-width="3"/>
  <text x="234" y="426" text-anchor="middle" font-family='${MONO}' font-size="26" font-weight="700" letter-spacing="2" fill="${INK}">DAILY CHALLENGE</text>
  <text x="84" y="510" font-size="46" letter-spacing="4">🟩🟩🟨🟩🟥</text>
</svg>`;

// iOS rounds the corners itself and shows transparency as black, so the icon
// is a full square of the page colour with the globe on it.
const touch = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="${PAPER}"/>
  ${globe(86, 86, 66, 6, 5)}
</svg>`;

const { chromium } = await import("playwright").catch(() => {
  console.error("Playwright is needed to render the PNGs; see the comment at the top of this file.");
  process.exit(1);
});
const browser = await chromium.launch();
for (const [svg, file, width, height] of [
  [og, "public/og.png", 1200, 630],
  [touch, "public/apple-touch-icon.png", 180, 180],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  writeFileSync(new URL(`../${file}`, import.meta.url), await page.screenshot({ type: "png" }));
  console.log(`wrote ${file}`);
  await page.close();
}
await browser.close();
