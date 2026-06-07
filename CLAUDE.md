# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Omni Geo Quiz — a React + D3.js quiz app testing US geography knowledge through several game modes (State, City, Airport, and Airport Satellite). No backend; deployable to GitHub Pages. The home screen also features an interactive Three.js globe.

## Commands

- `npm run dev` — start Vite dev server (serves at `/omni-geo-quiz/` base path)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally

## Stack

- **React** (via Vite, no TypeScript)
- **D3.js** — `d3-geo` (AlbersUsa projection), `d3-selection` for SVG rendering
- **us-atlas** — `states-10m.json` TopoJSON (provides `states` and `nation` objects)
- **topojson-client** — converts TopoJSON to GeoJSON features
- **point-in-polygon** — validates random points land inside the correct state geometry

## Architecture

**App.jsx** manages a single `mode` state (`null` | `"state"` | `"city"` | `"airport"` | `"airport-satellite"` | `"city-satellite"`) to switch between HomeScreen and quiz components.

**USMap.jsx** is the shared map component used by the map-based quiz modes (State, City, and the Airport Blank Map). It renders an SVG with:
- All continental US state paths filled white with white stroke (no visible state borders)
- A single national border outline (dark stroke)
- An optional red dot at `dotPosition` (projected via AlbersUsa)
- Optional green highlight on a revealed state via `revealedStateId`

It exports `states` (filtered GeoJSON features excluding AK, HI, and territories) for use by StateQuiz.

**StateQuiz.jsx / CityQuiz.jsx / AirportQuiz.jsx / AirportSatelliteQuiz.jsx / CitySatelliteQuiz.jsx** follow the same pattern: a wrapper component holds `gameKey` and `finalScore`, and a `Game` inner component handles round logic. Incrementing `gameKey` remounts `Game` for a clean restart. Each game runs 10 rounds, tracks score, and calls `onFinish(score)` to show ResultsScreen.

**State Quiz point generation** (`utils/randomPoint.js`): picks the largest polygon of a state by bounding-box area, shrinks bounds by 10%, and rejection-samples up to 1000 times using point-in-polygon to guarantee the dot falls inside the state.

**Fuzzy matching** (`utils/fuzzyMatch.js`): normalizes input (lowercase, strip punctuation), checks common abbreviations (DC, NYC, LA, etc.), then falls back to Levenshtein distance with a 25%-of-answer-length threshold.

**City data** (`data/cities.js`): 62 hardcoded US cities with `{name, lat, lng, state}`. Coordinates are approximate city centers. This is the authoritative city list — add/remove entries here to change the City Quiz pool.

## Game Modes

Selected from HomeScreen. The City and Airport tiles open a sub-mode modal (Blank Map
vs. Satellite) before launching.

- **US State Quiz** — blank Albers USA map, a random point inside a state; user guesses
  the state name.
- **US City Quiz** — same map, a red dot on a preset city from `src/data/cities.js`; user
  guesses the city name. Sub-modes: **Blank Map** and **Satellite**. The Satellite
  sub-mode launches the City Satellite Quiz below.
- **City Satellite Quiz** (`CitySatelliteQuiz.jsx`, mode `"city-satellite"`) — shows a
  satellite image from `public/satellite/cities/{imageFile}`, drawn from
  `src/data/satellite-cities.js`; user guesses the city. Accepts the city name (fuzzy)
  or common abbreviations (NYC, NOLA, DC, SF, LA); autocomplete and the reveal use the
  `City, State` form. Two-level hints reveal region then state.
- **US Airport Quiz** — same map, a red dot on a preset airport from
  `src/data/airports.js`; user guesses the airport code or city. Sub-modes: **Blank Map**
  and **Satellite**. Blank Map has a two-level hint system (level 1: airline hub →
  level 2: state). The Satellite sub-mode launches the Airport Satellite Quiz below.
- **Airport Satellite Quiz** (`AirportSatelliteQuiz.jsx`, mode `"airport-satellite"`) —
  shows a satellite image from `public/satellite/airports/{CODE}.jpg`, drawn from the
  curated `src/data/satellite-airports.js` pool; user guesses the airport. Two-level
  hints reveal region (US Census-style) then state.

Both satellite quizzes share `AirportGuessInput` (it takes an optional `placeholder` and a
custom `getSuggestions`) and the floating `FeedbackBubble` / hint-bubble behavior. Note the
two quizzes use **different** region groupings: the Airport quiz uses Census-style regions;
the City quiz uses a finer set (West Coast, Southwest, Mountain West, Midwest, South,
Southeast, Northeast, Non-contiguous).

## Data Files

- **`src/data/cities.js`** — 62 US cities with `{name, lat, lng, state}` (plus
  abbreviation/suggestion helpers). Authoritative City Quiz pool.
- **`src/data/airports.js`** — 37 US airports with `{code, name, city, lat, lng, state, hubs}`.
- **`src/data/satellite-airports.js`** — 28 airports curated for visual distinctiveness,
  the pool for the Airport Satellite Quiz.
- **`src/data/satellite-cities.js`** — all 62 cities (mirrors `cities.js`, fields
  `{name, lat, lng, state, imageFile}`) — the pool for the City Satellite Quiz.
  `imageFile` is the city name with spaces → underscores (the two Portlands carry a
  `_Oregon` / `_Maine` suffix).

## Satellite Imagery

- Images are stored in `public/satellite/airports/` and `public/satellite/cities/`.
- Generated via `scripts/fetch-satellite.js` using the Google Maps Static API.
- Run with: `GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js --target=airports`
  (default) or `--target=cities`.
- Requests use `scale=2` with `size=640x640` (1280×1280 px output), `maptype=satellite`,
  north-up orientation. Per-entry zoom overrides live in the script. Re-runs skip images
  that already exist.
- Airport files are named `{CODE}.jpg`; city files are `{CityName}.jpg` with spaces →
  underscores, and a `_{State}` suffix is appended to duplicate city names (e.g. Portland)
  to avoid collisions.

## Key Technical Notes

- **CSS minification**: `vite.config.js` uses Lightning CSS (`transformer` and
  `cssMinify`) so the modal's `backdrop-filter` keeps both the standard property and an
  emitted `-webkit-` prefix. The default esbuild minifier collapsed the hand-written pair
  to just `-webkit-`, breaking the blur in Firefox.
- **Globe** (`Globe.jsx`): Three.js with `OrbitControls`, delta-time rotation (frame-rate
  independent), cycling through five planets (Earth, Mars, Jupiter, Saturn, Neptune).
  Earth uses a locally-painted canvas texture; the others lazy-load equirectangular
  photos, and Saturn renders a 3D ring.
- All quiz screens share the same retro button style documented in the Design System
  section below.

## Design System

The established visual language across all screens. New UI should conform to it.

- **Background**: `#FAF7F4` (warm off-white) throughout every screen.
- **Buttons** (all interactive buttons): white background, solid black border, hard
  offset shadow `3px 3px 0px #111` (no blur), `border-radius: 12px`. On hover/press the
  button shifts 2px down-right and the shadow reduces, giving a physical press feel.
- **Corner info boxes** (Round, Score, Start Over, Home): equal-size squares using the
  same button style above. In quizzes they sit in fixed corners — Round/Score/Start Over
  stacked top-right, Home bottom-left.
- **Control panel**: a bordered container with the same hard-shadow style; each row has a
  left-aligned label and a right-aligned ON/OFF button.
- **ON/OFF toggle buttons**: retro push-button style. OFF state shows black text; ON state
  shows orange `#F97316` text.
- **Layout**: every screen uses a no-scroll, full-viewport layout.
- **Map**: a blank white US continental map rendered with the Albers USA projection — no
  state borders or labels visible by default.

## GitHub Pages Deployment

`vite.config.js` sets `base: "/omni-geo-quiz/"` for GitHub Pages. The repo name must match this base path.
