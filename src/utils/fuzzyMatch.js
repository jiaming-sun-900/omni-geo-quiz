export function fuzzyMatch(guess, answer) {
  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const g = normalize(guess);
  const a = normalize(answer);

  if (g === a) return true;

  // Handle common abbreviations
  const abbreviations = {
    "dc": "district of columbia",
    "washington dc": "district of columbia",
    "st louis": "saint louis",
    "nyc": "new york",
    "ny": "new york",
    "la": "los angeles",
    "sf": "san francisco",
    "philly": "philadelphia",
    "nola": "new orleans",
    "okc": "oklahoma city",
    "slc": "salt lake city",
    "kc": "kansas city",
  };

  if (abbreviations[g] === a) return true;

  // Levenshtein distance for typo tolerance
  const distance = levenshtein(g, a);
  const threshold = Math.max(1, Math.floor(a.length * 0.25));
  return distance <= threshold;
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
