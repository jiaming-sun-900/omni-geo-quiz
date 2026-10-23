// Sweeps every quiz pool for the two classes of bug that spot-checking misses,
// plus the data invariants the quizzes rely on. CI runs it; so should you after
// touching a matcher, a pool, a coordinate or an image.
//
//   1. Cross-accepts: every accepted form of every entry (name, code, short
//      name, "City, State", abbreviation...) is fed to every OTHER entry's
//      matcher and must be rejected. This is the sweep that once found 87 wrong
//      answers being scored as right.
//   2. Self-accepts: each entry's own forms, plus a list of real-world typos
//      and nicknames, must be accepted.
//   3. Data: US points lie inside their claimed state, the satellite city pool
//      mirrors cities.js, and every image a pool names exists (and no others).
//
// Usage: npm run check

import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
// Vite's module runner resolves the extensionless imports and JSON the app
// uses, so the sweep exercises the real source with no separate build step.
const load = async (path) => (await runnerImport(root + path)).module;

const { states } = await load("src/data/usGeo.js");
const { stateAbbreviations } = await load("src/data/states.js");
const { cities, cityAbbreviations } = await load("src/data/cities.js");
const { satelliteCities } = await load("src/data/satellite-cities.js");
const { airports } = await load("src/data/airports.js");
const { satelliteAirports } = await load("src/data/satellite-airports.js");
const { satelliteWorldCities, worldCityAbbreviations } = await load(
  "src/data/satellite-world-cities.js"
);
const { satelliteWorldAirports } = await load("src/data/satellite-world-airports.js");
const { airportAnswerForms } = await load("src/utils/airportMatch.js");
const { default: pointInPolygon } = await import("point-in-polygon");

// The mode definitions the game itself runs, so the sweep tests each mode's
// real `match`, not a reconstruction of it.
const mode = async (name) => (await load(`src/modes/${name}.js`)).default;
const MODE = {
  usState: await mode("usState"),
  usCity: await mode("usCity"),
  usCitySatellite: await mode("usCitySatellite"),
  usAirport: await mode("usAirport"),
  usAirportSatellite: await mode("usAirportSatellite"),
  worldCity: await mode("worldCity"),
  worldAirport: await mode("worldAirport"),
};

const failures = [];
const fail = (msg) => failures.push(msg);
let checks = 0;

// ---- Pools: each entry with its accepted forms and its mode's matcher ----

// The State Quiz's target is { state, point }; only the state matters here.
const statePool = MODE.usState.pool.map((state) => {
  const name = state.properties.name;
  return {
    label: name,
    forms: [name, stateAbbreviations[name]],
    match: (g) => MODE.usState.match(g, { state }),
  };
});

const usCityPool = (def) =>
  def.pool.map((c) => ({
    label: `${c.name}, ${c.state}`,
    // The bare name is shared by the two Portlands, so it is a form both accept.
    shared: c.name,
    forms: [c.name, `${c.name}, ${c.state}`, cityAbbreviations[c.name]].filter(Boolean),
    match: (g) => def.match(g, c),
  }));

const worldCityPool = MODE.worldCity.pool.map((c) => ({
  label: c.name,
  forms: [c.name, `${c.name}, ${c.country}`, worldCityAbbreviations[c.name]].filter(Boolean),
  match: (g) => MODE.worldCity.match(g, c),
}));

function airportPool(def, codeKey) {
  const list = def.pool;
  const forms = airportAnswerForms(list, codeKey);
  const cityCount = (city) => list.filter((a) => a.city === city).length;
  return list.map((a, i) => ({
    label: a[codeKey],
    // Same-city airports share the city name, which neither of them accepts.
    shared: a.city,
    forms: [...forms[i], a[codeKey], ...(cityCount(a.city) === 1 ? [a.city] : [])],
    match: (g) => def.match(g, a),
  }));
}

const POOLS = {
  "US State": statePool,
  "US City": usCityPool(MODE.usCity),
  "City Satellite": usCityPool(MODE.usCitySatellite),
  "World City": worldCityPool,
  "US Airport": airportPool(MODE.usAirport, "code"),
  "Airport Satellite": airportPool(MODE.usAirportSatellite, "code"),
  "World Airport": airportPool(MODE.worldAirport, "iata"),
};

// ---- 1 and 2: cross-accepts and self-accepts ----

for (const [poolName, pool] of Object.entries(POOLS)) {
  for (const target of pool) {
    for (const form of target.forms) {
      checks++;
      if (!target.match(form)) fail(`${poolName}: own form "${form}" rejected for ${target.label}`);
    }
    for (const other of pool) {
      if (other === target) continue;
      for (const form of other.forms) {
        if (form === other.shared && other.shared === target.shared) continue;
        checks++;
        if (target.match(form)) {
          fail(`${poolName}: "${form}" (${other.label}) accepted for ${target.label}`);
        }
      }
    }
  }
}

// Real inputs, right and wrong. [pool, target label, guess, should accept]
const find = (poolName, label) => POOLS[poolName].find((e) => e.label === label);
const CASES = [
  // Typos that must still score.
  ["US State", "Massachusetts", "Massachusets", true],
  ["US State", "California", "Callifornia", true],
  ["US State", "Pennsylvania", "Pensylvania", true],
  ["US City", "Philadelphia, Pennsylvania", "Philadelpia", true],
  ["US City", "Cincinnati, Ohio", "Cincinatti", true],
  ["US City", "Pittsburgh, Pennsylvania", "Pittsburg", true],
  ["US City", "Albuquerque, New Mexico", "Albuquerqe", true],
  ["US City", "Minneapolis, Minnesota", "Minneapols", true],
  ["World Airport", "LHR", "Heatrow", true],
  // Common names and spellings.
  ["US City", "St. Louis, Missouri", "Saint Louis", true],
  ["US City", "New York, New York", "New York City", true],
  ["US City", "Washington DC, District of Columbia", "DC", true],
  ["US City", "Washington DC, District of Columbia", "Washington", true],
  ["City Satellite", "Portland, Oregon", "Portland", true],
  ["City Satellite", "Portland, Oregon", "Portland, Maine", false],
  ["City Satellite", "Portland, Maine", "Portland, Oregon", false],
  ["World City", "São Paulo", "Sao Paulo", true],
  ["US Airport", "STL", "Saint Louis", true],
  ["US Airport", "MDW", "Midway", true],
  ["US Airport", "DAL", "Love Field", true],
  ["US Airport", "HOU", "Hobby", true],
  ["US Airport", "IAH", "Bush", true],
  ["US Airport", "DCA", "Reagan", true],
  ["US Airport", "DCA", "Reagan National", true],
  ["US Airport", "JFK", "Kennedy", true],
  ["US Airport", "DFW", "Fort Worth", true],
  ["US Airport", "ORD", "O'Hare", true],
  ["US Airport", "LGA", "La Guardia", true],
  ["US Airport", "ORD", "Chicago", false],
  ["US Airport", "BWI", "Washington", false],
  ["Airport Satellite", "ATL", "Hartsfield", true],
  ["Airport Satellite", "SEA", "SeaTac", true],
  ["World Airport", "LHR", "Heathrow", true],
  ["World Airport", "LGW", "Gatwick", true],
  ["World Airport", "HND", "Haneda", true],
  ["World Airport", "NRT", "Narita", true],
  ["World Airport", "PVG", "Pudong", true],
  ["World Airport", "PEK", "Capital", true],
  ["World Airport", "CDG", "Charles de Gaulle", true],
  ["World Airport", "CDG", "de Gaulle", true],
  ["World Airport", "GIG", "Galeao", true],
  ["World Airport", "LHR", "London", false],
  // A one-letter slip from a DIFFERENT answer must not score.
  ["US State", "South Carolina", "Noth Carolina", false],
  ["US State", "North Carolina", "Soth Carolina", false],
  ["US State", "South Dakota", "Noth Dakota", false],
  ["US State", "North Dakota", "Soth Dakota", false],
  ["US State", "Kansas", "Akansas", false],
  ["US State", "South Dakota", "ND", false],
  ["US City", "Portland, Oregon", "Orland", false],
  ["US City", "Boston, Massachusetts", "Hoston", false],
  ["World City", "Dubai", "Mubai", false],
  ["World Airport", "ICN", "Cancun International", false],
];
for (const [poolName, label, guess, expected] of CASES) {
  checks++;
  const entry = find(poolName, label);
  if (!entry) fail(`case: no ${label} in ${poolName}`);
  else if (entry.match(guess) !== expected) {
    fail(`${poolName}: "${guess}" ${expected ? "rejected" : "accepted"} for ${label}`);
  }
}

// Every hint of every entry renders to something, so a data gap shows up here
// rather than as an empty bubble mid-game.
for (const [name, def] of Object.entries(MODE)) {
  for (const item of def.pool) {
    const target = name === "usState" ? { state: item, point: [0, 0] } : item;
    def.hints.forEach((hint, level) => {
      checks++;
      const h = hint(target);
      if (!h || (typeof h === "object" && !h.items?.length)) {
        fail(`${name}: hint ${level + 1} is empty for ${def.reveal(target)}`);
      }
    });
  }
}

// ---- 3: data ----

// Every US point inside the state it claims (DCA once sat inside DC while
// claiming Virginia, so the blank-map dot and its hint disagreed).
const inFeature = (f, lng, lat) => {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys.some(([outer, ...holes]) =>
    pointInPolygon([lng, lat], outer) && !holes.some((h) => pointInPolygon([lng, lat], h))
  );
};
const stateByName = new Map(states.map((f) => [f.properties.name, f]));
for (const [poolName, list, key] of [
  ["cities.js", cities, "name"],
  ["airports.js", airports, "code"],
  ["satellite-airports.js", satelliteAirports, "code"],
]) {
  for (const e of list) {
    checks++;
    const f = stateByName.get(e.state);
    if (!f) fail(`${poolName}: ${e[key]} claims unknown state ${e.state}`);
    else if (!inFeature(f, e.lng, e.lat)) fail(`${poolName}: ${e[key]} is outside ${e.state}`);
  }
}

// The City Satellite pool mirrors cities.js entry for entry.
checks++;
const strip = ({ name, lat, lng, state }) => JSON.stringify({ name, lat, lng, state });
if (cities.map(strip).join() !== satelliteCities.map(strip).join()) {
  fail("satellite-cities.js no longer mirrors cities.js");
}

// Every image a pool names exists, and every file on disk is used by a pool
// (orphans are dead weight on the Pages deploy).
for (const [dir, names] of [
  ["airports", satelliteAirports.map((a) => `${a.code}.jpg`)],
  ["cities", satelliteCities.map((c) => c.imageFile)],
  ["world-cities", satelliteWorldCities.map((c) => c.imageFile)],
  ["world-airports", satelliteWorldAirports.map((a) => a.imageFile)],
]) {
  const onDisk = new Set(readdirSync(`${root}public/satellite/${dir}`));
  const wanted = new Set(names);
  for (const n of wanted) {
    checks++;
    if (!onDisk.has(n)) fail(`public/satellite/${dir}/${n} is missing`);
  }
  for (const n of onDisk) {
    checks++;
    if (!wanted.has(n)) fail(`public/satellite/${dir}/${n} is not used by any pool`);
  }
}

if (failures.length > 0) {
  console.error(`${failures.length} of ${checks} checks failed:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`All ${checks} answer and data checks passed.`);
