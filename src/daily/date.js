// The Daily Challenge runs on the player's local calendar date, like Wordle:
// everyone gets the same puzzle on the same date, wherever they are.

// Challenge #1 is this date; the number counts days from it.
const FIRST_DAY = "2026-10-23";

// "YYYY-MM-DD" for a local date.
export function dateKey(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Whole days between two keys. Done on UTC midnights, so a daylight-saving
// change can't make a day 23 or 25 hours long.
function utcDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

export function daysBetween(a, b) {
  return utcDay(b) - utcDay(a);
}

// The challenge number shown to players: #1 on FIRST_DAY.
export function dayNumber(key) {
  return daysBetween(FIRST_DAY, key) + 1;
}

export function previousKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d - 1));
}

// Milliseconds to the next local midnight, when the next challenge opens.
export function msUntilTomorrow(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}
