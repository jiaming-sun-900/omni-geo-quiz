import usState from "../modes/usState";
import usCity from "../modes/usCity";
import usAirport from "../modes/usAirport";
import usCitySatellite from "../modes/usCitySatellite";
import usAirportSatellite from "../modes/usAirportSatellite";
import worldCity from "../modes/worldCity";
import worldAirport from "../modes/worldAirport";
import { daysBetween } from "./date";

// The ten rounds of a day's challenge: five in the US, from the blank map to
// satellite, then five around the world. The share grid prints them as those
// two rows of five.
const SLOTS = [
  usState,
  usCity,
  usAirport,
  usCitySatellite,
  usAirportSatellite,
  worldCity,
  worldAirport,
  worldCity,
  worldAirport,
  worldCity,
];

// Any fixed date works as the origin of the cycle; changing it reshuffles every
// past and future day.
const ORIGIN = "2026-10-23";

// Small, well-mixed 32-bit PRNG. Deterministic is the point: the same seed
// gives every player the same sequence.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a: turns a string into a 32-bit seed.
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// A fixed shuffle of a pool's indices (Fisher-Yates on a seeded PRNG).
function permutation(length, seed) {
  const random = mulberry32(seed);
  const order = [...Array(length).keys()];
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Each pool walks through a shuffle of itself, a few entries per day, so
// nothing repeats until the whole pool has been through (the 54 world cities,
// three a day, take 18 days), then starts a freshly shuffled pass. Pools shared by two slots (the City map and
// City satellite pools mirror each other) are keyed by name rather than by
// mode, so they share one walk and can't both land on Denver the same day.
const WALKS = new Map([
  [usCity, "us-cities"],
  [usCitySatellite, "us-cities"],
]);

// What makes two entries the same place: the reveal text ("Hartsfield-Jackson
// Atlanta International (ATL) — Atlanta, Georgia" in both airport pools). A
// mode with a `prepare` step (the State Quiz) reveals from the prepared target,
// and overlaps no other pool, so its index is enough.
function identity(def, index) {
  return def.prepare ? `${def.slug}:${index}` : def.reveal(def.pool[index]);
}

export function buildPlan(key) {
  const day = daysBetween(ORIGIN, key);
  const perDay = new Map();
  for (const def of SLOTS) {
    const walk = WALKS.get(def) ?? def.slug;
    perDay.set(walk, (perDay.get(walk) ?? 0) + 1);
  }

  const taken = new Map();
  const seen = new Set();
  return SLOTS.map((def) => {
    const walk = WALKS.get(def) ?? def.slug;
    const nth = taken.get(walk) ?? 0;
    taken.set(walk, nth + 1);
    // Step `step` of the walk falls in pass `cycle` through the pool, and each
    // pass has its own shuffle: with one fixed shuffle the same three world
    // cities came back together, in the same slots, every 18 days.
    const length = def.pool.length;
    const step = day * perDay.get(walk) + nth;
    const cycle = Math.floor(step / length);
    const order = permutation(length, hash(`ogq:${walk}:${cycle}`));
    let pos = step - cycle * length;
    // Skip ahead past anything already in today's plan: the US airport pools
    // overlap (ATL is in both), and a day that straddles two passes could
    // otherwise draw one entry from each end.
    for (let tries = 0; tries < length && seen.has(identity(def, order[pos])); tries++) {
      pos = (pos + 1) % length;
    }
    const index = order[pos];
    const item = def.pool[index];
    seen.add(identity(def, index));
    const random = mulberry32(hash(`ogq:${key}:${def.slug}:${nth}`));
    return { def, index, target: def.prepare ? def.prepare(item, random) : item };
  });
}
