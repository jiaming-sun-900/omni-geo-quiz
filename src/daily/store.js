import { previousKey } from "./date";

// Daily Challenge progress, kept in this browser's localStorage and nowhere
// else. One record per date:
//   { status: "playing" | "done", score, review: [ ...one entry per answered round ] }
// Saved after every answer, so a reload resumes at the next round instead of
// offering a fresh look at the one just played.
//
// Storage can be missing or throw (private windows, blocked site data). Every
// access is wrapped, and the challenge stays playable; it just forgets.

const KEY = "ogq.daily.v1";
// Enough history for the streak and the "played" count to mean something
// without the record growing forever.
const KEEP_DAYS = 400;

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function getDay(key) {
  return readAll()[key] ?? null;
}

export function saveDay(key, record) {
  try {
    const all = readAll();
    all[key] = record;
    const keys = Object.keys(all).sort();
    for (const old of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete all[old];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Not persisted; nothing else to do.
  }
}

// `streak` counts consecutive finished days ending today, or ending yesterday
// while today is still unplayed, so the streak doesn't read 0 every morning.
export function getStats(today) {
  const all = readAll();
  const done = (k) => all[k]?.status === "done";
  let day = done(today) ? today : previousKey(today);
  let streak = 0;
  while (done(day)) {
    streak++;
    day = previousKey(day);
  }
  const played = Object.values(all).filter((r) => r.status === "done").length;
  return { streak, played };
}
