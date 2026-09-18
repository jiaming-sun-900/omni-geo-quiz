# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Omni Geo Quiz — a React + D3.js quiz app testing geography knowledge through
five game modes: US State, US City, US Airport (each with a blank-map and, for
City/Airport, a satellite sub-mode), World City and World Airport (satellite
only). No backend; deployable to GitHub Pages. The home screen also features an
interactive Three.js globe.

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

**App.jsx** manages a single `mode` state (`null` | `"state"` | `"city"` |
`"airport"` | `"airport-satellite"` | `"city-satellite"` |
`"world-city-satellite"` | `"world-airport-satellite"`) to switch between
HomeScreen and the quiz components, which live in a `QUIZZES` lookup keyed by
mode.

**Code splitting.** HomeScreen (and Three.js with it) is in the initial bundle;
every quiz mode is a `React.lazy` import behind one `<Suspense>` with the
`.mode-loading` fallback. This keeps d3-geo, topojson and the us-atlas TopoJSON
(a ~179 kB chunk) out of first load for players who only open a satellite mode.
Adding a mode means adding a `lazy()` line and a `QUIZZES` entry, nothing else.

**USMap.jsx** is the shared map component used by the map-based quiz modes (State, City, and the Airport Blank Map). It renders an SVG with:
- All continental US state paths filled white with white stroke (no visible state borders)
- A single national border outline (dark stroke)
- An optional red dot at `dotPosition` (projected via AlbersUsa)
- Optional green highlight on a revealed state via `revealedStateId`

**Dot radius scales with the rendered map width** (`w / 160`, clamped to
2.5–6px, so the ceiling is already reached at desktop map widths and only the
compact layouts shrink the dot). A fixed radius covers a growing share of the country as the map
shrinks: at 6px the dot is wider than Rhode Island (5.4 × 7.7px projected) on a
390px phone map, and wider than DC (5.2 × 6.3px) even on the widest desktop map,
which turned those rounds into guesswork. Tying it to the width keeps the dot
covering the same geographic area at every size, and the 6px ceiling leaves the
desktop look unchanged.

**The geometry lives in `src/data/usGeo.js`**, not in USMap: `nation` plus
`states` (GeoJSON features excluding only the territories AS/GU/MP/PR/VI —
**Alaska and Hawaii are kept**, since geoAlbersUsa draws them in the bottom-left
insets and they are fair quiz targets). It is its own module because a file that
exports both a component and plain data breaks Vite's fast refresh. StateQuiz
imports `states` from there and filters out the District of Columbia (FIPS `11`)
for its own pool: DC is not a state, and at map scale a dot on it also covers
Maryland and Virginia, so the three are indistinguishable.

**StateQuiz.jsx / CityQuiz.jsx / AirportQuiz.jsx / AirportSatelliteQuiz.jsx /
CitySatelliteQuiz.jsx / WorldCitySatelliteQuiz.jsx /
WorldAirportSatelliteQuiz.jsx** all follow the same pattern: a wrapper component
holds `gameKey` and `result`, and a `Game` inner component handles round logic.
Incrementing `gameKey` remounts `Game` for a clean restart. Each game runs 10
rounds, tracks score, and calls `onFinish(score, review)` to show ResultsScreen.
The map modes' overlay toggles (Rivers / Mountains / State Borders) are held by
the **wrapper**, above the remount, so Start Over resets the score and round but
leaves the overlays as the player set them. `Game` seeds its first round with
`pick…(new Set())` rather than the used-index ref, because reading a ref during
render is a React rules violation.

**Advancing past the feedback bubble** (`utils/useAdvanceOnDismiss.js`): one
shared hook, used by all seven `Game`s, attaches the window `keydown`/`click`
listeners that advance the round while the bubble is up. Attaching them from an
effect keyed on the bubble's visibility is what stops the very keypress that
submitted the answer from dismissing it, and `onAdvance` is read through a ref
refreshed after each render so the handler always sees the current round without
re-attaching. Clicks inside `.sq-toggles`, `.state-quiz-header` and
`.sq-bottom-left` are ignored: those controls own their own clicks, and before
the exception existed, flipping an overlay to double-check an answer also burned
the round.

**End-of-game review.** Every `Game` accumulates one entry per answered round in a
`reviewRef` (pushed from `handleGuess`, so a Shuffle / New Image that replaces the target
without answering is correctly not recorded), and hands the array up through
`onFinish(score, review)`. Each entry is
`{ round, correct, guess, answer, wiki, lat, lng, image?, zoom? }` — `image` only in the
satellite modes, where it's the same file the round just displayed and is therefore already
cached (revalidated, and decoded from the full 1280px source, so the thumbnails carry
`loading="lazy"` / `decoding="async"` and explicit dimensions). `zoom` overrides the map
link's default city-level zoom; only the State Quiz passes it (`6`), because its
coordinates are a random point inside the state rather than a landmark, and zoom 13
would open on an arbitrary field.
`ResultsScreen` renders all 10 rounds with misses sorted first (stable sort, so each group
stays in round order), and gives every entry a Wikipedia and a satellite-map link built by
`src/utils/reviewLinks.js`. Both links are generated from data the quizzes already carry,
so there is no hand-maintained URL table: Wikipedia goes through `Special:Search?go=Go`
(jumps to the article on a title match, falls back to a result list instead of a 404), and
the map uses Google's documented Maps URLs API on the satellite basemap at the round's
exact coordinates. `TITLE_OVERRIDES` in that file holds the two entries whose data-file
name differs from Wikipedia's title; the rest were verified against the MediaWiki API.
Note the results screen is the one screen in the app allowed to scroll.

**State Quiz point generation** (`utils/randomPoint.js`): picks the largest polygon of a state by bounding-box area, shrinks bounds by 10%, and rejection-samples up to 1000 times using point-in-polygon to guarantee the dot falls inside the state.

**Fuzzy matching** (`utils/fuzzyMatch.js`): normalizes input (lowercase, strip punctuation), checks common abbreviations (DC, NYC, LA, etc.), then falls back to Levenshtein distance with a 25%-of-answer-length threshold.

**City data** (`data/cities.js`): 62 hardcoded US cities with `{name, lat, lng, state}`. Coordinates are approximate city centers. This is the authoritative city list — add/remove entries here to change the City Quiz pool.

## Game Modes

Selected from HomeScreen. The City and Airport tiles open a sub-mode modal (Blank Map
vs. Satellite) before launching; the two World tiles are satellite-only and launch
directly. The modal is a `role="dialog"` / `aria-modal` container that moves focus to its
first option on open and closes on Escape or a backdrop click.

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
- **World City Quiz** (`WorldCitySatelliteQuiz.jsx`, mode `"world-city-satellite"`) —
  satellite image from `public/satellite/world-cities/{imageFile}`, pool
  `src/data/satellite-world-cities.js` (54 cities); user guesses the city. Four hint
  levels: region → country → first letter → the entry's `funFact`.
- **World Airport Quiz** (`WorldAirportSatelliteQuiz.jsx`, mode
  `"world-airport-satellite"`) — satellite image from
  `public/satellite/world-airports/{IATA}.jpg`, pool
  `src/data/satellite-world-airports.js` (60 airports); accepts the IATA code, the full
  airport name or the city. Four hint levels: continent → country → city → IATA code.

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
- **`src/data/satellite-world-cities.js`** — 54 world cities
  `{name, lat, lng, country, region, funFact, imageFile}`; `funFact` is the last hint.
- **`src/data/satellite-world-airports.js`** — 60 world airports
  `{name, iata, city, country, region, lat, lng, imageFile}`.
- **`src/data/usGeo.js`** — the us-atlas TopoJSON as GeoJSON: `nation` and `states`.

Entries in the two world files tagged `// VERIFY` have coordinates or a crop that has
not yet been checked against the fetched image. `docs/world-*-quiz-roster.md` holds the
rosters those pools were built from.

## Satellite Imagery

- Images are stored in `public/satellite/{airports,cities,world-airports,world-cities}/`.
- Generated via `scripts/fetch-satellite.js` using the Google Maps Static API.
- Run with: `GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js --target=airports`
  (default), `--target=cities`, `--target=world-cities` or `--target=world-airports`.
- Requests use `scale=2` with `size=640x640` (1280×1280 px output), `maptype=satellite`,
  `format=jpg`, north-up orientation. Per-entry zoom and coordinate overrides live in the
  script. Re-runs skip images that already exist.
- **The committed images predate `format=jpg`**, so despite their `.jpg` names they are
  still the API's default png8: 256-colour indexed PNG, ~1.2 MB each, 254 MB over 222
  files (`file public/satellite/cities/Chicago.jpg` says `PNG image data ... 8-bit
  colormap`). That is visible colour banding on continuous-tone imagery, ~14 MB
  downloaded per 10-round game, and a quarter of the 1 GB GitHub Pages limit. Converting
  the set means deleting a target's directory and re-fetching it, which costs API quota,
  so it hasn't been done. `public/satellite/airports/` also holds 18 images for airports
  that are in `airports.js` but not in the satellite pool, and so are never shown.
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
- **Autocomplete accessibility**: the three answer fields (`StateGuessInput`,
  `GuessInput`, `AirportGuessInput`) are ARIA comboboxes — the input carries
  `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and
  `aria-activedescendant` pointing at `${listId}-opt-${i}`, with `listId` from `useId()`.
  The dropdown already had `role="listbox"`/`role="option"`; without the input side of the
  pair a screen reader was never told the suggestions existed and arrow-key movement was
  silent.
- **Globe texture failures**: the planet photos are hotlinked from Wikimedia, so they can
  fail (offline, blocked network, a renamed Commons file). `setPlanet` therefore clears the
  outgoing photo immediately and passes an `onError` that paints the planet's flat base
  colour. Without it a failed load left the *previous* planet's texture on the sphere while
  the label read the new one, so an unreachable Mars looked exactly like Earth. These
  textures are CC BY (Solar System Scope) and are not yet credited anywhere in the UI;
  self-hosting them under `public/` would also remove the runtime dependency on Wikimedia.
- **Known lint exceptions**: `npm run lint` is clean except for three
  `react-hooks/set-state-in-effect` errors, one per answer-input component. They are the
  effect that clears the field when a new round starts (keyed on `disabled`). Removing it
  means remounting each input via a `key` that includes the round, across all seven
  quizzes, and the focus/clear behaviour is the same in every mode — worth doing
  deliberately rather than as a drive-by, since the payoff is one avoided re-render per
  round.

## Design System

The established visual language across all screens. New UI should conform to it.

- **Background**: `#FAF7F4` (warm off-white) throughout every screen.
- **Buttons** (all interactive buttons): white background, solid black border, hard
  offset shadow `3px 3px 0px #111` (no blur), `border-radius: 12px`. On hover/press the
  button shifts 2px down-right and the shadow reduces, giving a physical press feel.
- **Corner info boxes** (Round, Score, Shuffle / New Image, Home): equal-size squares
  using the same button style above. On the desktop layout they sit in fixed corners —
  Round/Score/Shuffle stacked top-right, Home bottom-left. The Home button is icon-only,
  so it (like the two results-screen buttons) carries an `aria-label` with the emoji
  marked `aria-hidden`. Below 1025px (or on a short
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
