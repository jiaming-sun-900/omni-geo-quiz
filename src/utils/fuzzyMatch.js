// Generic descriptor words that carry no discriminating information. Nearly
// every airport name contains one, and leaving them in breaks the match in two
// directions at once: they inflate the length-based threshold AND shrink the
// edit distance between two unrelated airports. With "International" in both
// strings, "Cancun International" scored as a match for "Incheon International"
// (and 57 other wrong pairs across the world-airport pool).
const GENERIC_TOKENS = new Set([
  "international",
  "airport",
  "intl",
  "regional",
  "national",
  "field",
]);

// Largest edit distance ever tolerated, whatever the answer's length. The old
// proportional-only threshold let a long answer buy a budget big enough to
// reach a different, equally valid answer.
const MAX_DISTANCE = 2;

const ABBREVIATIONS = {
  dc: "district of columbia",
  "washington dc": "district of columbia",
  "st louis": "saint louis",
  nyc: "new york",
  ny: "new york",
  la: "los angeles",
  sf: "san francisco",
  philly: "philadelphia",
  nola: "new orleans",
  okc: "oklahoma city",
  slc: "salt lake city",
  kc: "kansas city",
};

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Drops the generic tokens so the distinctive part of the name is what gets
// compared. Falls back to the input when every word was generic, so two
// all-generic names can't collapse to "" and match each other.
function stripGeneric(normalized) {
  const kept = normalized.split(" ").filter((w) => !GENERIC_TOKENS.has(w));
  return kept.length > 0 ? kept.join(" ") : normalized;
}

// `pool` is the list of every valid answer in the same quiz pool. Passing it
// lets the matcher tell a typo apart from a different, deliberately-given
// answer — see the guard below. It is optional only so a caller without a pool
// still works; every call site in the app supplies one.
export function fuzzyMatch(guess, answer, pool = []) {
  const g = normalize(guess);
  const a = normalize(answer);

  if (!g) return false;
  if (g === a) return true;
  if (ABBREVIATIONS[g] === a) return true;

  // The guess names a DIFFERENT entry in this pool, exactly. That is a wrong
  // answer, not a typo of the right one, so it must never reach the fuzzy
  // fallback — which is what scored "North Dakota" for South Dakota, "Kansas"
  // for Arkansas, and most of the airport-name cross-matches. Checked after the
  // exact-match cases above, so a pool with two entries of the same name (the
  // two Portlands) still accepts that name for either of them.
  for (const other of pool) {
    const o = normalize(other);
    if (o === a) continue;
    if (g === o || g === stripGeneric(o)) return false;
  }

  const gs = stripGeneric(g);
  const as = stripGeneric(a);
  if (gs === as) return true;

  // Threshold from the *stripped* length, so "Denver International" gets the
  // budget of "denver" rather than of the full 20-character string.
  const threshold = Math.min(
    MAX_DISTANCE,
    Math.max(1, Math.floor(as.length * 0.25))
  );
  return levenshtein(gs, as) <= threshold;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
