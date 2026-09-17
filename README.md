# Omni Geo Quiz

A US and world geography quiz: find a place on a blank map, or name it from
satellite imagery. Five modes, ten rounds each, no backend.

Built with React + Vite, D3 (`d3-geo`'s AlbersUsa projection) for the maps, and
Three.js for the interactive planet on the home screen.

**Live:** https://jiaming-sun-900.github.io/omni-geo-quiz/

## Modes

| Mode | What you see | What you answer |
| --- | --- | --- |
| US State Quiz | A red dot somewhere inside a state on a blank map | The state |
| US City Quiz | A red dot on one of 62 US cities | The city |
| US Airport Quiz | A red dot on one of 37 US airports | The IATA code or the city |
| World City Quiz | A satellite image of one of 54 world cities | The city |
| World Airport Quiz | A satellite image of one of 60 world airports | The airport |

The City and Airport tiles first ask for a sub-mode: **Blank Map** (the dot on
the Albers USA map) or **Satellite** (the image). Answers are matched leniently:
case and punctuation are ignored, common abbreviations (NYC, NOLA, DC, SF, LA)
are accepted, and a Levenshtein threshold of 25% of the answer's length absorbs
typos. Every mode has a two-level hint (four in the world modes) that narrows
the region before the country or state.

After the tenth round the results screen lists all ten rounds with misses first,
each with a Wikipedia link and a Google Maps satellite link generated from the
round's own coordinates.

## Running it

```bash
npm install
npm run dev      # Vite dev server, served under the /omni-geo-quiz/ base path
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint
npm run deploy   # publish dist/ to the gh-pages branch
```

`vite.config.js` sets `base: "/omni-geo-quiz/"` for GitHub Pages, so the
repository name has to match that path.

## Layout

```
src/
  App.jsx                 mode switch; every quiz mode is code-split (React.lazy)
  components/
    HomeScreen.jsx         menu + sub-mode modal
    Globe.jsx              Three.js globe, cycles through five planets
    USMap.jsx              shared Albers USA map: state fills, national outline, dot
    StateQuiz.jsx  CityQuiz.jsx  AirportQuiz.jsx            map-based modes
    CitySatelliteQuiz.jsx  AirportSatelliteQuiz.jsx         US satellite modes
    WorldCitySatelliteQuiz.jsx  WorldAirportSatelliteQuiz.jsx
    ResultsScreen.jsx      score + end-of-game review
    *GuessInput.jsx        the three autocomplete answer fields
  data/                    the quiz pools (plain JS arrays) and US geometry
  utils/                   fuzzy matching, random-point-in-state, review links
public/satellite/          the satellite imagery, by target
scripts/fetch-satellite.js downloads that imagery from the Google Static Maps API
```

Each quiz follows the same shape: a wrapper component holds `gameKey` and the
final result, and an inner `Game` runs the ten rounds. Bumping `gameKey`
remounts `Game` for a clean restart.

`CLAUDE.md` documents the architecture, the design system and the responsive
layout in detail, including several minifier and CSS pitfalls worth reading
before touching the stylesheet.

## Satellite imagery

The images are fetched once and committed, so the app needs no API key at
runtime:

```bash
GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js --target=cities
# targets: airports (default), cities, world-cities, world-airports
```

Re-runs skip files that already exist. Per-entry zoom and recentering overrides
live in the script.

**Known issue:** the committed images were fetched before the script set
`format=jpg`, so despite their `.jpg` names they are still 256-colour png8 (the
Static Maps API's default), about 1.2 MB each and 254 MB in total. The script is
fixed; converting the existing set means deleting a target's directory and
re-fetching it, which costs API quota.

## Data

The quiz pools are plain arrays, so changing what the game asks means editing
one file:

- `src/data/cities.js` — 62 US cities, the City Quiz pool
- `src/data/airports.js` — 37 US airports
- `src/data/satellite-airports.js` — 28 airports curated for visual distinctiveness
- `src/data/satellite-cities.js` — the 62 cities again, with image filenames
- `src/data/satellite-world-cities.js` / `-world-airports.js` — the world pools
- `src/data/usGeo.js` — the us-atlas TopoJSON converted to GeoJSON features

Entries in the world pools still tagged `// VERIFY` are ones whose crop or
coordinates have not been checked against the fetched image yet.
