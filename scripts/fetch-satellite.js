// Downloads satellite images using the Google Maps Static API.
//
// Three targets:
//   airports (default) — every airport in src/data/airports.js and
//     src/data/satellite-airports.js (deduplicated by IATA code), saved to
//     public/satellite/airports/{CODE}.jpg.
//   cities — every city in src/data/satellite-cities.js, saved to
//     public/satellite/cities/{CITYNAME}.jpg where CITYNAME is the city name
//     with spaces replaced by underscores (e.g. New_York.jpg).
//   world-cities — every city in src/data/satellite-world-cities.js, saved to
//     public/satellite/world-cities/{imageFile} (City_Country.jpg).
//
// Usage:
//   GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js
//   GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js --target=cities
//   GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js --target=world-cities
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
  "New York": 11, "Los Angeles": 11, "Chicago": 11, "San Jose": 11,
  "Austin": 11, "Jacksonville": 11, "Fort Worth": 11, "Anchorage": 11,
  "Salt Lake City": 11,
  "Key West": 13, "Boulder": 13, "Sarasota": 13,
  "Providence": 13, "Boise": 13, "Atlanta": 13, "Charlotte": 13,
  "Indianapolis": 13, "Milwaukee": 13, "Pittsburgh": 13,
};

// Per-world-city zoom, seeded directly from the roster's zoom-tier column in
// world-city-quiz-roster.md:
//   紧凑地标型 (single iconic landmark) -> 15
//   街区网络型 (street grid / canal / river bend) -> 13
//   大尺度地貌型 (coastline / harbor / mountain backdrop) -> 12
// Expect several review rounds; adjust these per-city as Jiaming sends notes.
const WORLD_CITY_ZOOM_OVERRIDES = {
  // 紧凑地标型 -> 15
  Osaka: 15, Kyoto: 15, Singapore: 15, Dubai: 15, Doha: 15, Agra: 15,
  "Kuala Lumpur": 15, Frankfurt: 15, Moscow: 15, Cairo: 15, Casablanca: 15,
  Sydney: 15,
  // 街区网络型 -> 13
  Beijing: 13, Shanghai: 13, Tokyo: 13, Seoul: 13, Bangkok: 13, Hanoi: 13,
  Paris: 13, Venice: 13, Rome: 13, Milan: 13, London: 13, Munich: 13,
  Barcelona: 13, Amsterdam: 13, Vienna: 13, Prague: 13, Toronto: 13,
  "Mexico City": 13, "São Paulo": 13, "Buenos Aires": 13, Marrakech: 13,
  Zanzibar: 13, Melbourne: 13, "Gold Coast": 13,
  // 大尺度地貌型 -> 12
  "Hong Kong": 12, Mumbai: 12, Istanbul: 12, Santorini: 12, Reykjavik: 12,
  Vancouver: 12, Havana: 12, "Panama City": 12, "Rio de Janeiro": 12,
  Santiago: 12, Cartagena: 12, "La Paz": 12, "Cape Town": 12, Nairobi: 12,
  Lagos: 12, Auckland: 12, Wellington: 12, Nadi: 12,
};

// Per-world-city center coordinate overrides; entries not listed use the lat/lng
// from satellite-world-cities.js. Kept available for manual per-city recentering
// across the expected review rounds (none needed on the first pass).
const WORLD_CITY_COORD_OVERRIDES = {};

// Per-city center coordinate overrides; cities not listed use the lat/lng from
// satellite-cities.js. Used to recenter the image on a more recognizable part
// of the metro.
const CITY_COORD_OVERRIDES = {
  "Denver": { lat: 39.7527, lng: -104.9998 },
  "Las Vegas": { lat: 36.1147, lng: -115.1728 },
  "Milwaukee": { lat: 43.0389, lng: -87.8800 },
  "Philadelphia": { lat: 39.9200, lng: -75.1700 },
  "Detroit": { lat: 42.3100, lng: -83.0500 },
  "San Diego": { lat: 32.7157, lng: -117.1611 },
  "Houston": { lat: 29.7604, lng: -95.3698 },
  "Charlotte": { lat: 35.2271, lng: -80.8431 },
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
    load: async () => {
      const list = await loadArray("satellite-cities.js", "satelliteCities");
      // Apply per-city coordinate overrides where present.
      return list.map((c) =>
        CITY_COORD_OVERRIDES[c.name] ? { ...c, ...CITY_COORD_OVERRIDES[c.name] } : c
      );
    },
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
  "world-cities": {
    outDir: join(SAT_DIR, "world-cities"),
    load: async () => {
      const list = await loadArray("satellite-world-cities.js", "satelliteWorldCities");
      return list.map((c) =>
        WORLD_CITY_COORD_OVERRIDES[c.name] ? { ...c, ...WORLD_CITY_COORD_OVERRIDES[c.name] } : c
      );
    },
    // Output name is the entry's imageFile (City_Country.jpg), already encoded in
    // the data file.
    fileName: (c) => c.imageFile,
    label: (c) => c.name,
    zoom: (c) => WORLD_CITY_ZOOM_OVERRIDES[c.name] ?? 13,
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fileExists = (path) =>
  access(path).then(() => true).catch(() => false);

function parseTarget() {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--target="));
  const name = arg ? arg.slice("--target=".length) : "airports";
  if (!TARGETS[name]) {
    console.error(`Unknown --target="${name}". Use "airports", "cities", or "world-cities".`);
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
