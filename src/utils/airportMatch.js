import { fuzzyMatch } from "./fuzzyMatch";

// Words that describe what an airport is rather than which one it is. They are
// dropped when deriving an airport's short name (below).
const NAME_FILLER = new Set([
  "international",
  "intercontinental",
  "airport",
  "intl",
  "regional",
  "national",
  "field",
  "metropolitan",
]);

// What people actually call an airport, where it is not simply its name with
// the city taken out (which is derived automatically: "London Heathrow" →
// "Heathrow"). Keyed by IATA code, which is unique across all three pools, so
// one table serves the US, Satellite and World airport quizzes.
const NICKNAMES = {
  ATL: ["Hartsfield"],
  CDG: ["de Gaulle"],
  CGK: ["Soekarno"],
  CTS: ["Chitose"],
  DCA: ["Reagan", "Reagan National"],
  HNL: ["Inouye"],
  HOU: ["Hobby"],
  JFK: ["Kennedy"],
  JNB: ["Tambo"],
  SEA: ["SeaTac"],
  SJC: ["Mineta"],
};

// Lowercase words with accents folded and apostrophes/periods removed, so
// "O'Hare" → "ohare" and "O.R. Tambo" → "or tambo"; other punctuation splits.
function words(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

// Every name each airport in `pool` answers to, by pool index: full name,
// derived short name, nicknames. `codeKey` is the field holding the IATA code
// ("code" in the US files, "iata" in the world file). Exported for the answer
// sweep in scripts/check-answers.js.
export function airportAnswerForms(pool, codeKey) {
  const cityKeys = new Set(pool.map((a) => words(a.city).join(" ")));

  // The name minus city words and filler: "Chicago Midway International" →
  // "midway". Dropped when it is too short to be distinctive, or when it is
  // itself a city in the pool: BWI's "Baltimore/Washington" leaves
  // "washington", which must not score for an airport that isn't IAD or DCA.
  return pool.map((a) => {
    const own = new Set(words(a.city));
    const short = words(a.name)
      .filter((w) => !NAME_FILLER.has(w) && !own.has(w))
      .join(" ");
    const shortName = short.length >= 4 && !cityKeys.has(short) ? short : null;
    return [a.name, shortName, ...(NICKNAMES[a[codeKey]] || [])].filter(Boolean);
  });
}

// Accepted: the exact code; the full name, its short name or a nickname
// (fuzzy); or the city (fuzzy) when only one airport in the pool serves it.
// Chicago, Houston, Washington, New York, Dallas, London, Tokyo and the rest
// have two dots and one city name, so for those the player has to say which
// airport, and the short names are what make that practical: "Midway",
// "Heathrow", "Hobby" and "Haneda" used to be rejected outright, because they
// are too many letters from "Chicago Midway International" to count as a typo.
export function makeAirportMatcher(pool, codeKey) {
  const cities = [...new Set(pool.map((a) => a.city))];
  const cityCounts = new Map();
  for (const a of pool) cityCounts.set(a.city, (cityCounts.get(a.city) || 0) + 1);
  const forms = airportAnswerForms(pool, codeKey);
  const indexByCode = new Map(pool.map((a, i) => [a[codeKey], i]));

  return function matchAirport(guess, airport) {
    const code = airport[codeKey];
    if (guess.trim().toLowerCase() === code.toLowerCase()) return true;

    // Every other airport's names and code, so the matcher can refuse a guess
    // that names, or sits closer to, a different airport.
    const i = indexByCode.get(code);
    const others = pool.flatMap((a, j) => (j === i ? [] : [...forms[j], a[codeKey]]));
    if (forms[i].some((f) => fuzzyMatch(guess, f, others))) return true;

    return cityCounts.get(airport.city) === 1 && fuzzyMatch(guess, airport.city, cities);
  };
}
