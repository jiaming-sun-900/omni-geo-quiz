// Downloads satellite images using the Google Maps Static API.
//
// Two targets:
//   airports (default) — every airport in src/data/airports.js and
//     src/data/satellite-airports.js (deduplicated by IATA code), saved to
//     public/satellite/airports/{CODE}.jpg.
//   cities — every city in src/data/satellite-cities.js, saved to
//     public/satellite/cities/{CITYNAME}.jpg where CITYNAME is the city name
//     with spaces replaced by underscores (e.g. New_York.jpg).
//
// Usage:
//   GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js
//   GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js --target=cities
//
// Safe to re-run: existing images are skipped.

import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAT_DIR = join(__dirname, "..", "public", "satellite");
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

// Per-airport zoom overrides; airports not listed use this target's default.
const AIRPORT_ZOOM_OVERRIDES = {
  BNA: 14, CVG: 14, CLE: 14, SAT: 14, STL: 14, BOS: 14, PVD: 14, SLC: 14, PDX: 14,
  ANC: 12, HNL: 14, BWI: 14, MDW: 14, DAL: 14, HOU: 14, RDU: 14, AUS: 14,
  ATL: 14, CLT: 14, DCA: 14, EWR: 14, LAX: 14, LGA: 14, MIA: 14, PHX: 14, SFO: 14,
  MCI: 14, SAN: 14, MSY: 14, SJC: 14, SNA: 14, BUR: 14, PIT: 13, CMH: 14, TPA: 14,
};

// Per-city zoom overrides; cities not listed use this target's default.
const CITY_ZOOM_OVERRIDES = {
  "New York": 11, "Los Angeles": 11, "Chicago": 11, "Houston": 11,
  "Phoenix": 11, "Philadelphia": 11, "San Antonio": 11, "Dallas": 11,
  "San Jose": 11, "Austin": 11, "Jacksonville": 11, "Fort Worth": 11,
  "Key West": 13, "Palm Springs": 13, "Boulder": 13, "Sarasota": 13,
  "Providence": 13, "Boise": 13,
};

// Target configs: each describes how to load entries, name output files, and
// pick a per-entry zoom.
const TARGETS = {
  airports: {
    outDir: join(SAT_DIR, "airports"),
    load: loadAirports,
    fileName: (a) => `${a.code}.jpg`,
    label: (a) => a.code,
    zoom: (a) => AIRPORT_ZOOM_OVERRIDES[a.code] ?? 13,
  },
  cities: {
    outDir: join(SAT_DIR, "cities"),
    load: () => loadArray("satellite-cities.js", "satelliteCities"),
    // Spaces -> underscores. Names shared by more than one city (e.g. Portland,
    // OR vs ME) get a state suffix so their images don't collide.
    fileName: (c, all) => {
      const isDuplicate = all.filter((x) => x.name === c.name).length > 1;
      const base = isDuplicate ? `${c.name} ${c.state}` : c.name;
      return `${base.replace(/ /g, "_")}.jpg`;
    },
    label: (c) => c.name,
    zoom: (c) => CITY_ZOOM_OVERRIDES[c.name] ?? 12,
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fileExists = (path) =>
  access(path).then(() => true).catch(() => false);

function parseTarget() {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--target="));
  const name = arg ? arg.slice("--target=".length) : "airports";
  if (!TARGETS[name]) {
    console.error(`Unknown --target="${name}". Use "airports" or "cities".`);
    process.exit(1);
  }
  return TARGETS[name];
}

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing GOOGLE_MAPS_API_KEY environment variable. See .env.example."
    );
    process.exit(1);
  }

  const target = parseTarget();
  await mkdir(target.outDir, { recursive: true });

  const entries = await target.load();

  for (const entry of entries) {
    const { lat, lng } = entry;
    const label = target.label(entry);
    const outPath = join(target.outDir, target.fileName(entry, entries));

    if (await fileExists(outPath)) {
      console.log(`Skipping ${label} (already exists)`);
      continue;
    }

    const zoom = target.zoom(entry);
    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: String(zoom),
      size: "640x640",
      scale: "2",
      maptype: "satellite",
      key: apiKey,
    });
    const url = `https://maps.googleapis.com/maps/api/staticmap?${params}`;

    console.log(`Fetching ${label}...`);
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error(`  Failed ${label}: ${res.status} ${res.statusText} ${body}`);
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
