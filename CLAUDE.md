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
  same button style above. On the desktop layout they sit in fixed corners —
  Round/Score/Start Over stacked top-right, Home bottom-left. Below 1025px (or on a short
  viewport) they collapse into a single compact top bar; see Responsive Layout.
- **Control panel**: a bordered container with the same hard-shadow style; each row has a
  left-aligned label and a right-aligned ON/OFF button.
- **ON/OFF toggle buttons**: retro push-button style. OFF state shows black text; ON state
  shows orange `#F97316` text.
- **Layout**: every screen uses a no-scroll, full-viewport layout.
- **Map**: a blank white US continental map rendered with the Albers USA projection — no
  state borders or labels visible by default.

## Responsive Layout

Everything is driven by the root font size plus a stack of media-query tiers at the bottom of
`src/App.css`. Anything wider than 1024px **and** taller than 620px renders the original
desktop layout untouched; the tiers only add overrides below that.

- **Root scale** (`src/index.css`): `19px` → `18px` (≤900) → `17px` (≤600) → `16px` (≤400)
  → `15px` (landscape under 480px tall). Nearly every size in the app is a `rem`, so these
  five values rescale the whole UI at once.
- **Tier 1 — ≤900px**: the home screen stacks into a single column; globe, title and menu
  panel shrink so the whole screen still fits an iPad portrait without scrolling.
  A separate `901–1220px` block trims the menu type so entry names stay on one line in
  the narrow two-column layout (tablet landscape / small laptop).
- **Tier 2 — ≤1024px *or* ≤620px tall**: the quiz chrome leaves the corners and joins the
  flow. `.state-quiz-header` becomes a real top bar holding Round/Score/Shuffle, the Home
  button is pinned to the container's top-left (the empty half of that same row), and
  `.sq-toggles` becomes a compact horizontal row under the map. Nothing is layered over
  anything else, so the map/image gets whatever room is left.
- **Tier 3 — ≤600px**: phone sizing. The guess form rewraps so the text field gets its own
  full-width row with Hint + Submit sharing the row beneath it (matched via
  `.guess-form > [type="submit"]`, since the three inputs style Submit differently). The
  sub-mode modal squares shrink to `min(42vw, 13rem)`.
- **Tier 4 — ≤400px / ≤380px / landscape**: last-resort tightening. The `[ENTER]` menu tag
  is dropped below 380px; landscape phones get every vertical margin trimmed.

The home screen additionally has **height**-driven tiers, because its content (globe +
title + five menu rows) is the tallest thing in the app. These must stay mutually
disjoint — they set the same properties, so any overlap means "whichever block is last in
the file wins" and the layout grows again instead of shrinking. The live partition is:

| Tier | Condition |
| --- | --- |
| short phone | `≤600px` wide and `≤800px` / `≤700px` tall |
| landscape phone | `≤520px` tall, landscape |
| short stacked home | `601–900px` wide, `521–720px` tall |
| short two-column home | `≥901px` wide, `521–720px` tall |

Everything fits without scrolling from 360×780 up; only 320×568 and 568×320 still scroll,
which is fine now that `.home-screen` scrolls rather than clipping (see below).

Other pieces of the system:

- **Content sizing is measured, not guessed.** `USMap` sizes its projection from the
  measured `.us-map-wrap` box (via `ResizeObserver`), not from a fixed fraction of the
  viewport, so it shrinks correctly once surrounding chrome takes real space. The wrapper
  is `flex: 1; min-height: 0; overflow: hidden`, so its size is decided by the layout and
  never by the SVG inside it — measuring it cannot feed back into its own size. The
  original desktop cap now lives in CSS as `.us-map-wrap { max-height: 66vh }` (lifted to
  `none` in the compact tier), so it's already baked into the measured box — don't
  reintroduce a vh term in `computeDims`.
- **Satellite image sizing**: `.sat-stage` is the same kind of flexible box, with
  `container-type: size`; the square `.sat-frame` inside it is sized
  `height: min(100cqh, 100cqw, 68vh, 88vw)`. Both of the stage's dimensions have to
  constrain a square — a width-driven one overflows a short stage, a height-driven one
  overflows a narrow stage, and `aspect-ratio` does **not** transfer a `max-*` cap back to
  the axis you set explicitly (a plain `height: 100% + max-width` letterboxes the frame and
  `object-fit: cover` then crops the image). Container units express both limits at once.
  The `68vh` term is the original desktop size, so large screens are unchanged.
- **Write fallbacks as `@supports`, not stacked declarations.** Lightning CSS drops the
  earlier of two same-property declarations, so the classic
  `min-height: 100vh; min-height: 100dvh` pattern ships only the `dvh` line. Both the
  `dvh` heights and the container-query frame sizing therefore keep their fallback in the
  base rule and put the modern value inside `@supports (…)`, which the minifier can't
  collapse. Same class of trap as the `backdrop-filter` prefix note above — check
  `dist/assets/*.css` after touching either.
- **Desktop collision guard**: `.state-quiz` sets `--map-inset` / `--controls-inset`, which
  reserve horizontal room for the floating corner boxes and the toggle panel so the
  centered map and prompt can never slide underneath them in a narrow desktop window. The
  compact tier sets both to `0`.
- **Mobile viewport**: `index.html` uses `viewport-fit=cover`; `:root` exposes
  `--safe-top/right/bottom/left` from `env(safe-area-inset-*)`, and every fixed/absolute
  corner control adds them to its offset. Heights use `100dvh` (with a `100vh` fallback,
  see the @supports note) so mobile Safari's collapsing URL bar cannot push content off-screen.
- **Touch**: the quiz inputs skip `autoFocus` on touch devices (`src/utils/isTouch.js`)
  so the on-screen keyboard doesn't cover the map before you've seen it. Under
  `@media (hover: none)` the retro press animation is driven by `:active` instead of
  `:hover`, which would otherwise stick after a tap. `@media (pointer: coarse)` gives the
  ON/OFF toggles and the Reset View button a 34px minimum height.
  `prefers-reduced-motion` disables the dot pop/ripple and the globe's fan animation.
- **Never clip, scroll instead**: `.home-screen` is `overflow-y: auto`, and it centers with
  auto margins on its columns rather than `align-items/justify-content: center` — auto
  margins collapse to zero once the content is taller than the container, so the top of
  the page stays reachable. Centering a scroll container the usual way puts the overflow
  out of reach.
- **The globe's speed fan** opens to the left below 820px (`.globe-fan { right: 100% }`),
  since its button sits close to the right edge once the globe column is full-width.

## GitHub Pages Deployment

`vite.config.js` sets `base: "/omni-geo-quiz/"` for GitHub Pages. The repo name must match this base path.
