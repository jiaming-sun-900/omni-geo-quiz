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
npm run check    # answer-matching sweep over every quiz pool, plus data checks
npm run deploy   # publish dist/ to the gh-pages branch
```

`vite.config.js` sets `base: "/omni-geo-quiz/"` for GitHub Pages, so the
repository name has to match that path.

## Layout

```
src/
  App.jsx                 route → screen; every mode is code-split (React.lazy)
  routes.js  router.js    the page table and a small History API router
  modes/                  one plain-JS definition per mode: pool, matcher, hints
  daily/                  the Daily Challenge: plan, local save, share grid
  quiz/
    QuizScreen.jsx         a mode's game, then its results (Play again remounts)
    QuizGame.jsx           the shared engine that runs any mode's ten rounds
    MapStage.jsx  SatelliteStage.jsx   what a round shows
  components/
    HomeScreen.jsx         hero (globe, daily challenge) + mode cards; styles in src/home.css
    AboutScreen.jsx        how to play, credits, privacy
    Globe.jsx              Three.js globe, cycles through five planets
    USMap.jsx              shared Albers USA map: state fills, national outline, dot
    ResultsScreen.jsx      score + end-of-game review
    *GuessInput.jsx        the three autocomplete answer fields
  data/                    the quiz pools (plain JS arrays) and US geometry
  utils/                   fuzzy and airport matching, random-point-in-state, review links
public/satellite/          the satellite imagery, by target
scripts/
  check-answers.js         npm run check: cross-accept sweep over every pool, data checks
  fetch-satellite.js       downloads the imagery from the Google Static Maps API
  build-favicon.js         generates public/favicon.svg
```

The Daily Challenge (`/omni-geo-quiz/daily`) is ten mixed rounds, the same for
everyone on the same date, with a shareable emoji grid and a streak kept in the
browser.

Every page has its own URL (`/omni-geo-quiz/world-airport` and so on). At build
time `vite.config.js` writes a copy of `index.html` into each route's folder, so
those links also work on GitHub Pages.

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
