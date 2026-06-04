// Downloads a satellite image for every airport in src/data/airports.js and
// src/data/satellite-airports.js (deduplicated by IATA code) using the Google
// Maps Static API, saving them to public/satellite/airports/{CODE}.jpg.
//
// Usage:
//   GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js
//
// Safe to re-run: existing images are skipped.

import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "satellite", "airports");
const DATA_DIR = join(__dirname, "..", "src", "data");

// These source files use extensionless imports that only Vite resolves, so
// instead of importing the modules we extract and evaluate just the named array
// literal from each file's source text.
async function loadArray(fileName, exportName) {
  const src = await readFile(join(DATA_DIR, fileName), "utf8");
  const re = new RegExp(`export const ${exportName}\\s*=\\s*(\\[[\\s\\S]*?\\n\\];)`);
  const match = src.match(re);
  if (!match) throw new Error(`Could not locate the ${exportName} array in ${fileName}`);
  // The matched text is a plain array of object literals — safe to evaluate.
  return new Function(`return ${match[1].replace(/;$/, "")}`)();
}

// Merge both airport sources, keeping the first entry seen for each IATA code.
async function loadAirports() {
  const lists = [
    await loadArray("airports.js", "airports"),
    await loadArray("satellite-airports.js", "satelliteAirports"),
  ];
  const byCode = new Map();
  for (const list of lists) {
    for (const airport of list) {
      if (!byCode.has(airport.code)) byCode.set(airport.code, airport);
    }
  }
  return [...byCode.values()];
}

// Per-airport zoom overrides; airports not listed use DEFAULT_ZOOM.
const DEFAULT_ZOOM = 13;
const ZOOM_OVERRIDES = {
  BNA: 14, CVG: 14, CLE: 14, SAT: 14, STL: 14, BOS: 14, PVD: 14, SLC: 14, PDX: 14,
  ANC: 12, HNL: 14, BWI: 14, MDW: 14, DAL: 14, HOU: 14, RDU: 14, AUS: 14,
  ATL: 14, CLT: 14, DCA: 14, EWR: 14, LAX: 14, LGA: 14, MIA: 14, PHX: 14, SFO: 14,
  MCI: 14, SAN: 14, MSY: 14, SJC: 14, SNA: 14, BUR: 14, PIT: 13, CMH: 14, TPA: 14,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fileExists = (path) =>
  access(path).then(() => true).catch(() => false);

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing GOOGLE_MAPS_API_KEY environment variable. See .env.example."
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const airports = await loadAirports();

  for (const airport of airports) {
    const { code, lat, lng } = airport;
    const outPath = join(OUT_DIR, `${code}.jpg`);

    if (await fileExists(outPath)) {
      console.log(`Skipping ${code} (already exists)`);
      continue;
    }

    const zoom = ZOOM_OVERRIDES[code] ?? DEFAULT_ZOOM;
    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: String(zoom),
      size: "640x640",
      scale: "2",
      maptype: "satellite",
      key: apiKey,
    });
    const url = `https://maps.googleapis.com/maps/api/staticmap?${params}`;

    console.log(`Fetching ${code}...`);
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error(`  Failed ${code}: ${res.status} ${res.statusText} ${body}`);
      await sleep(200);
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(outPath, buffer);

    await sleep(200);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
