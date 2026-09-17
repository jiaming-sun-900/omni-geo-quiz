// "Explore more" links for the end-of-game review. Both are generated from data
// the quizzes already carry (a name, a lat/lng), so every entry in every mode
// gets them with no hand-maintained URL table to go stale.

// The generated query is a Wikipedia article title for all but a couple of
// entries (checked against the MediaWiki API across every city, airport and
// state in src/data). These are the exceptions, where the data file's own
// naming differs from Wikipedia's.
const TITLE_OVERRIDES = {
  "Washington DC, District of Columbia": "Washington, D.C.",
  "John Wayne Orange County Airport": "John Wayne-Orange County Airport",
};

// Special:Search with go=Go jumps straight to the article when the title
// matches (following redirects and near-misses in punctuation) and falls back to
// a result list when it doesn't. That fallback is what makes generating these
// links safe: a name Wikipedia titles differently costs one extra click rather
// than landing on a 404.
export function wikipediaUrl(query) {
  const q = encodeURIComponent(TITLE_OVERRIDES[query] || query);
  return `https://en.wikipedia.org/wiki/Special:Search?go=Go&search=${q}`;
}

// Google Maps' documented Maps URLs API, opened on the satellite basemap at the
// exact coordinates the round used — so the link picks up right where the quiz
// image stopped and the player can pan out from there.
export function satelliteMapUrl(lat, lng, zoom = 13) {
  return (
    "https://www.google.com/maps/@?api=1&map_action=map" +
    `&center=${lat},${lng}&zoom=${zoom}&basemap=satellite`
  );
}

// Several airport records store a shortened name ("Beijing Capital
// International"); Wikipedia's article titles keep the word "Airport". Adding it
// back turns a search-results detour into a direct hit.
export function airportWikiQuery(name) {
  return /airport$/i.test(name.trim()) ? name : `${name} Airport`;
}
