export const TOTAL_ROUNDS = 10;

// A game is ten rounds, or the whole pool when that is smaller (Oceania has
// five airports): past that, rounds would start repeating. Its own module
// because a component file that also exports a function breaks fast refresh.
export function roundsFor(def) {
  return Math.min(TOTAL_ROUNDS, def.pool.length);
}
