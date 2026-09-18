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
- `npm run lint` — ESLint; **must stay at zero errors**, CI fails the build otherwise

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

**Code splitting.** Every quiz mode is a `React.lazy` import behind one
`<Suspense>` with the `.mode-loading` fallback, and **Globe is lazy too**, loaded
inside HomeScreen behind its own `<Suspense>`. Adding a mode means adding a
`lazy()` line and a `QUIZZES` entry, nothing else.

Globe has to be split because Three.js + OrbitControls is ~649 kB and Globe also
imports `d3-geo`, `topojson-client` and `world-atlas/countries-110m.json`. While
it sat in the entry chunk, a player who only opens a satellite mode — which needs
none of that — still downloaded all of it, and the earlier claim here that d3-geo
and topojson were deferred was simply false. Current split: entry **197 kB**
(62 kB gzip), `Globe` 647 kB, `USMap` (us-atlas TopoJSON) 179 kB, each quiz
4–16 kB. The Globe `<Suspense>` fallback reuses the real `.globe-*` class names
and keeps the three control rows at `visibility: hidden`, so it reserves the exact
same four rows and the home screen doesn't reflow when the globe arrives.

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

**Overlay strokes scale the same way, and for the same reason.** State borders
are `#8c93a0` (3.09:1 on white, clearing the 3:1 non-text floor — the old
`#c0c0c0` was 1.82:1) and the width scales *inversely* with map width, ~0.73px on
a 958px desktop map and ~1.20px on a 363px phone map. At a fixed 0.5px the
strokes went sub-pixel on a phone, so flipping State Borders ON appeared to do
nothing at all. Mountains are `#A9C49A` with a `#6F8F5C` outline for the same
visibility reason. Both must read clearly when ON without becoming a heavy
graphic — this is still a blank-map quiz.

**USMap subscribes to resize exactly once**, via `ResizeObserver` on
`.us-map-wrap`. It used to also listen to window `resize` and `orientationchange`,
which the observer already covers, and `computeDims` returned a fresh object every
call so `setDimensions` re-rendered even when the box hadn't moved — one resize
fired 2–3 full `selectAll("*").remove()` + re-project cycles. It now bails when
the measured dimensions are unchanged: 30 resize + 30 orientationchange events at
a fixed viewport cause **zero** redraws, and six distinct widths cause exactly six.

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
the round. The **Hint** button and **Shuffle / New Image** are `disabled` while
the bubble is up rather than merely excluded from the advance: excluding them made
the click a silent no-op, and in the three map modes `handleShuffle` used to also
call `setFeedback(null)`, which re-enabled the input without advancing the round
counter — a player could answer, Shuffle, answer again, and farm **27/10 and a
"Perfect score!"** while `reviewRef` collected duplicate `round` values. The four
satellite modes never had the bug; their `handleNewImage` omits the reset. Keep it
that way.

`pick…` takes an exclude argument covering the *current, unanswered* target as
well as the answered ones, so Shuffle can never hand back the target already on
screen (which looked like a broken button).

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
exact coordinates. `TITLE_OVERRIDES` in that file holds the entries whose data-file name
differs from Wikipedia's title — two where the name itself differs, plus `Cartagena` and
`Gold Coast`, which are Wikipedia *disambiguation* pages and need the qualified form.
Targeted overrides were chosen over passing `${name}, ${country}` for every world city,
which would have risked regressing the other 52. The rest were verified against the
MediaWiki API. The percentage is computed from `review.length`, not the `total` prop, and
rows are keyed on their pre-sort index rather than `item.round`, so neither can be thrown
off by a malformed review array. The heading is focused on mount, since otherwise the
unmounting answer input dropped focus to `<body>` and a screen-reader user was never told
the game had ended. Note the results screen is the one screen in the app allowed to scroll.

**State Quiz point generation** (`utils/randomPoint.js`): picks the largest polygon of a state by bounding-box area, shrinks bounds by 10%, and rejection-samples up to 1000 times using point-in-polygon to guarantee the dot falls inside the state.

**Fuzzy matching** (`utils/fuzzyMatch.js`): normalizes input (lowercase, strip
punctuation), checks common abbreviations (DC, NYC, LA, etc.), then falls back to
Levenshtein distance. **It takes the pool as an argument**, because three guards
need to know what the other valid answers are:

1. A guess that exactly equals a *different* entry in the same pool is rejected
   outright, never fuzzed.
2. Generic tokens (`international`, `airport`, `intl`, `regional`, `national`,
   `field`) are stripped from both sides before the distance is computed.
3. The threshold is capped at **2** and derived from the *stripped* length.

Without these, a plain 25%-of-answer-length threshold scored **87 wrong answers
as correct**: 58 pairs in World Airport alone (23 of 60 targets — `Cancun
International` was accepted for Incheon, Athens, Kansai, Hamad, Vancouver,
Tocumen, Galeão and Cairo, because the shared `International` suffix bought a
threshold of 5–6), 15 in US Airport, 9 in Satellite Airport, and North/South
Dakota, North/South Carolina and `Kansas`→Arkansas in the State Quiz. All 87 are
now rejected while typo tolerance is intact (`Philadelpia`, `Cincinatti`,
`Massachusets`, `Pittsburg`, `Albuquerqe`, `Callifornia`, `Pensylvania`,
`Minneapols` all still pass). `matchesState` additionally rejects a bare
two-letter abbreviation belonging to another state, so `ND` no longer scores for
South Dakota. **If you widen the threshold or add a pool, re-run a full
cross-accept sweep** — every entry against every other entry's accepted forms —
because this class of bug is invisible to spot-checking.

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

The satellite quizzes share `AirportGuessInput` (it takes an optional `placeholder` and a
custom `getSuggestions`), the floating `FeedbackBubble` / hint-bubble behavior, and
`SatelliteImage.jsx` — one component holding the loading, error and retry states for all
four modes. Before it existed each rendered a bare `<img>` with no `onError`: at ~1.2 MB
an image, a slow connection showed an unexplained blank square and a 404 showed a
broken-image glyph with no way to recover. It is inline-styled rather than adding to
`App.css`.

Note the two *airport/city* variants use **different** region groupings: the Airport quiz
uses Census-style regions; the City quiz uses a finer set (West Coast, Southwest, Mountain
West, Midwest, South, Southeast, Northeast, Non-contiguous).

## Data Files

- **`src/data/cities.js`** — 62 US cities with `{name, lat, lng, state}` (plus
  abbreviation/suggestion helpers). Authoritative City Quiz pool.
- **`src/data/airports.js`** — 37 US airports with `{code, name, city, lat, lng, state, hubs}`.
  `AMBIGUOUS_CITIES` (derived from the data, not hand-listed: Chicago, Houston, Washington,
  New York, Dallas) blocks the bare city name for the 10 airports that share one, since
  `Chicago` used to score on both ORD and MDW — two different dots, one accepted answer.
  Each airport's own code and distinctive name still work. Same approach as
  `WorldAirportSatelliteQuiz.jsx`.
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

**The `// VERIFY` tags are gone — all 28 were reviewed against their fetched images** (18
cities, 10 airports; round 3 of the review). 26 came out clean straight away. Two were
defective and were **fixed by cropping the 1280px original out of git history**, with no
API call — see "Two images are crops, not fetches" below. Every coordinate in both files
is confirmed correct; the two problems were framing, not position.

Two more were noted in `scripts/fetch-satellite.js` and deliberately **not** changed,
because the current images are playable and a blind coordinate nudge can't be verified
without spending fetch quota: **Havana** (top ~45% of the frame is featureless ocean) and
**Nairobi** (sits deep enough into the national park that the city is a top-left sliver —
arguably intentional, since the park edge is its `funFact`). `docs/world-*-quiz-roster.md`
holds the rosters these pools were built from.

**Coordinates have been machine-verified**, not eyeballed: every US city and airport
point tests inside its claimed state via point-in-polygon against `usGeo.js`. That sweep
is what caught DCA, which sat at `-77.0377` — inside the District of Columbia, while the
entry claimed `state: "Virginia"`, so the blank-map dot and its level-2 hint disagreed.
It is now `-77.0402`, verified inside Virginia. Eight world entries (Hong Kong, Dubai,
Doha, Panama City, HKG, DPS, DOH, GIG) fall outside their country's 110m polygon but are
0.2–4 km from mapped coastline — harbour crops and reclaimed-land airfields the coarse
coastline misses, not errors. **Re-run the sweep after editing any coordinate.**

## Satellite Imagery

- Images are stored in `public/satellite/{airports,cities,world-airports,world-cities}/`.
- Generated via `scripts/fetch-satellite.js` using the Google Maps Static API. **The key
  that produced this set no longer works** — it was on a Google Cloud free trial that has
  since lapsed, and the GCP project now reports `Billing is disabled`, so the script
  cannot run until a real billing account is attached (a card is required even for the
  free monthly tier). Assume re-fetching is unavailable and reach for a crop of the
  1280px original in git history first.
- Run with: `GOOGLE_MAPS_API_KEY=your_key node scripts/fetch-satellite.js --target=airports`
  (default), `--target=cities`, `--target=world-cities` or `--target=world-airports`.
- Requests use `scale=2` with `size=640x640` (1280×1280 px output), `maptype=satellite`,
  `format=jpg`, north-up orientation. Per-entry zoom and coordinate overrides live in the
  script. Re-runs skip images that already exist.
- **The committed images are now real JPEG, re-encoded locally at 1024px / quality 82.**
  They used to predate `format=jpg` and so, despite their `.jpg` names, were still the
  API's default png8: 256-colour indexed PNG, ~1.2 MB each, **233 MB** over 204 files.
  That was visible colour banding, 10.7–12.2 MB per 10-round game, and ~23% of the 1 GB
  GitHub Pages limit. The set is now **103 MB** (~4.7 MB per game) and the dither is gone,
  so it actually looks *better* than the original at the size `.sat-frame` displays.
  Re-encoding at the original 1280px only reached ~700 KB a file, because JPEG has to
  spend bits encoding the quantization dither — **downscaling first is what pays off**, and
  1024px still covers the frame's retina size. Done with `sips` in place, so it cost no API
  quota; note the old blobs stay in git history, so a fresh clone is unchanged in size even
  though the Pages deploy shrank. Future fetches return 1280px JPEGs straight from the API
  (`format=jpg` is already set), which is fine — no need to match 1024 exactly.
- **Four images are crops, not fetches**, and a re-fetch would overwrite them:
  `Mumbai_India.jpg` (928px), `Havana_Cuba.jpg` and `Nairobi_Kenya.jpg` (860px) under
  `world-cities/`, and `world-airports/KUL.jpg` (800px), where everything else is 1024px.
  **Cropping is the repair route of choice here**, because the API key that fetched this
  set was on a lapsed free trial and no longer works — see the note at the end of this
  section. All four were cut from the 1280px png8 originals recovered via
  `git show 7467ee8^:<path>`, so nothing was downscaled twice.
  - **Mumbai** came back with a plain white missing-imagery block over the lower-left
    quadrant — all of it open sea, so cropping it away removed the hole *and* improved the
    composition; the peninsula now fills the frame.
  - **KUL** framed the airfield at ~25% of the frame. A centred crop is arithmetically the
    same operation as zooming in, so it now reads at ~50% with all three runways and the
    Sepang circuit still in shot.
  - **Havana** was ~45% featureless ocean; the crop drops that to ~20% and makes the
    Y-shaped harbour and the old-town grid the subject.
  - **Nairobi** showed the city as a top-left sliver. The crop balances it to roughly half
    city, half park, keeping the national park's hard straight boundary — which is the
    whole point, since the park is its `funFact`.

  All four are below the frame's retina size and look marginally softer on a high-DPI
  screen; judged a good trade in every case. The fetch script's zoom overrides were moved
  to 13 for Mumbai and KUL so a future re-fetch lands near the crop, but **re-check these
  four after any re-fetch of the `world-cities` or `world-airports` targets** — the
  fetched version will not be the crop.
- **Kyoto is a known-weak frame that cropping cannot fix.** Its coordinate is Kinkaku-ji,
  but the Golden Pavilion reads as nothing from directly overhead — a small dark pond in
  trees, verified by cropping the original down to an 820m-wide frame. So the image is
  left wide, where it at least reads as Kyoto's street grid against the western hills.
  Fixing it properly means choosing a different landmark, which means a re-fetch.
- **The `airports` target fetches only `satellite-airports.js`.** It used to union that
  with `airports.js`, which is the *blank-map* pool and renders no imagery at all — so 18
  images (20.9 MB) were committed that no code path could ever load. They have been
  deleted and the script narrowed; don't re-widen it, or the next run silently re-downloads
  them on your API quota. The directory now holds exactly the 28 files the pool needs.
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
- **Globe teardown has two non-obvious cases.** Saturn's ring texture is *not* in the
  `textures` map (which is keyed by planet id), so it needs its own disposal —
  `Material.dispose()` does not dispose textures, and without it one GPU texture leaked per
  mount. And a `loader.load` in flight at unmount would write into the orphaned `textures`
  object and call `needsUpdate` on a disposed material, so a `disposed` flag set first in
  cleanup makes both the success and fallback callbacks bail (disposing the orphan texture).
  Planet switching itself does not leak — `textures` caches by id — but visiting all five
  holds ~30–40 MB of GPU texture.
- **The grab cursor over the planet is a raycast, not CSS.** `cursor: grab` on
  `.globe-disc canvas` would be far simpler and is wrong: the canvas is 2.5× the visible
  disc (see the next note) and fully transparent outside the planet, so the grab hand would
  follow the pointer across a large empty region of the home screen. A `pointermove`
  handler raycasts against the sphere — plus the ring while Saturn is up, since dragging it
  rotates the globe just the same — and sets the cursor only on a hit. `grabbing` is driven
  off the OrbitControls `start`/`end` events so it holds for the whole drag even once the
  pointer slides off the sphere.
- **The globe canvas is displayed at 250%, on purpose.** `.globe-disc canvas` is
  `width/height: 250%` with `margin: -75%` and `overflow: visible` on the disc, so Saturn's
  ring at radius 2.2 isn't clipped and the camera zooms out to match. The drawing buffer is
  therefore `min(DPR, 2)` per *displayed* CSS pixel — correct retina rendering, not
  oversampling. Don't "optimize" the 250× multiplier away; it leaves the buffer stretched
  over a 2.5× larger canvas and the globe goes blurry. `resize()` does bail when the
  measurement is unchanged, so a window drag no longer reallocates the buffer per tick.
- All quiz screens share the same retro button style documented in the Design System
  section below.
- **Autocomplete accessibility**: the three answer fields (`StateGuessInput`,
  `GuessInput`, `AirportGuessInput`) are ARIA comboboxes — the input carries
  `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and
  `aria-activedescendant` pointing at `${listId}-opt-${i}`, with `listId` from `useId()`.
  The dropdown already had `role="listbox"`/`role="option"`; without the input side of the
  pair a screen reader was never told the suggestions existed and arrow-key movement was
  silent.
- **Other screen-reader wiring**, all added because the visual design already conveyed the
  information and the accessibility tree didn't: the nine overlay switches carry
  `aria-label` (they had `role="switch"` + `aria-checked` but their label was a sibling
  `<span>`, so they announced as "switch, ON" with no indication of *what*); the Round and
  Score boxes are `role="status"` so changes are announced at all; the sub-mode modal traps
  Tab between its two options and restores focus to the menu row that opened it (it already
  moved focus in and closed on Escape, but Tab escaped behind the backdrop and focus was
  never given back).
- **Touch targets**: review links are `inline-flex` with `min-height: 40px` (measured
  85×40px). As inline anchors the padding alone did nothing and they were ~28px — below even
  the 34px the same block grants `.push-toggle`.
- **Globe textures are self-hosted** under `public/textures/` (four planet photos +
  Saturn's ring slice, 990 kB total), built from `TEX_BASE` off `import.meta.env.BASE_URL`.
  They used to be hotlinked from Wikimedia Commons, which made a core piece of the home
  screen depend on a third party at runtime — offline, a filtered network or a renamed
  Commons file all silently degraded it. `loader.setCrossOrigin("anonymous")` went with
  them; it existed only for the cross-origin CDN.
- **The `onError` fallback still matters** even self-hosted, and must stay: `setPlanet`
  clears the outgoing photo immediately and paints the planet's flat base colour on
  failure. Without it a failed load left the *previous* planet's texture on the sphere while
  the label read the new one, so an unreachable Mars looked exactly like Earth.
- **The textures are CC BY 4.0 (Solar System Scope), and the licence requires
  attribution** — `.globe-credit` under the Reset View button carries it. It needs the same
  `position: relative` + `z-index: 1` + `pointer-events: auto` treatment as
  `.globe-reset`, because the oversized globe canvas overflows down across that row and
  would otherwise eat the links' clicks. `GlobePlaceholder` in `HomeScreen.jsx` reserves
  the row too, so the column still can't reflow when the globe chunk lands.
- **The answer inputs are cleared by remount, not by an effect.** Each of the three input
  components used to clear its field from an effect keyed on `disabled`, which was the
  project's only three lint errors (`react-hooks/set-state-in-effect`). The effect is gone;
  every quiz now keys the input `${round}-${shuffleId}` (map modes) or
  `${round}-${current.index}` (satellite modes), so a new round and a Shuffle both remount
  it. If you touch this, preserve all three behaviours it carries: the field clears on a new
  round, Shuffle still remounts, and `autoFocus={!isTouchDevice()}` stays — focusing on
  remount on a phone pops the keyboard over the map before the player has seen it.
- **CI** (`.github/workflows/ci.yml`): install → `npm run lint` → `npm run build` on push
  and PR to `main`, with no `continue-on-error`. **`npm run lint` must stay at zero
  errors** — the gate exists because it was previously running nowhere. No deploy job;
  publishing is still a manual `gh-pages -d dist`.

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
- **ON/OFF toggle buttons**: retro push-button style. OFF is `#1a1a1a` text on the raised
  `#e2ddd2` face (12.6:1). ON **fills** the button with the signature orange `#FF4F00` and
  switches the text to `#111` (5.73:1). ON used to be orange *text* on the pressed face,
  which was **1.96:1 — unreadable** — and signalled purely by hue, a WCAG 1.4.1 failure.
  Filling fixes both at once: it flips the button's luminance, so ON and OFF differ by
  2.43:1 even in greyscale. The Submit button's enabled state had the identical bug and got
  the identical treatment. **Any new toggle state must clear 4.5:1 and be distinguishable
  without colour.**
- **Text colours**: secondary/meta text is `#6E6E7A` (4.71:1 on `#FAF7F4`). The former
  `#888` was 3.3–3.5:1, below AA.
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
  **The Home square's width is reserved, not assumed:** `--sq-home-size` is the single
  source for it and the header takes it as `padding-left`, with `.sq-right` allowed to wrap
  as a backstop. Without the reservation the three right-hand boxes (~325px) simply ran over
  the absolutely-positioned Home button at 375–390px wide. A `≤430px` block trims the box
  type so the bar stays one 42px row; verified no overlap and no horizontal scroll at 320,
  360, 375, 390, 414 and 768px.
- **Tier 3 — ≤600px**: phone sizing. The guess form rewraps so the text field gets its own
  full-width row with Hint + Submit sharing the row beneath it (matched via
  `.guess-form > [type="submit"]`, since the three inputs style Submit differently). The
  sub-mode modal squares shrink to `min(42vw, 13rem)`.
- **1025–1220px wide (and ≥621px tall)**: the same wrap as the phone tier, because the
  desktop `padding-inline: var(--controls-inset)` (15rem a side) left the text field just
  **82px** wide in that band. The fix wraps the form rather than shrinking
  `--controls-inset`, which would slide the form under the toggle panel; the input goes to
  398px at 1025px and ≥1280px stays byte-identical in layout.
- **Tier 4 — ≤400px / ≤380px / landscape**: last-resort tightening. The `[ENTER]` menu tag
  is dropped below 380px; landscape phones get every vertical margin trimmed.

The home screen additionally has **height**-driven tiers, because its content (globe +
title + five menu rows) is the tallest thing in the app. These must stay mutually
disjoint — they set the same properties, so any overlap means "whichever block is last in
the file wins" and the layout grows again instead of shrinking.

This table used to describe a partition that **wasn't actually disjoint**: a 600×500
landscape phone matched the short-phone tier, the `≤700px`-tall tier and the
landscape-phone tier all at once, and only rendered correctly because the landscape block
happened to sit last in the file. The guards now enforce the partition themselves — note
the explicit "not the short-landscape case" branch on the phone tier:

| Tier | Condition |
| --- | --- |
| short phone | `≤600px` wide, `≤800px` / `≤700px` tall, **and** (`≥521px` tall **or** portrait) |
| landscape phone | `≤520px` tall, landscape |
| short stacked home | `601–900px` wide, `521–720px` tall |
| short two-column home | `≥901px` wide, `521–720px` tall |

The `≤800px` / `≤700px` pair still deliberately nests — the second only overrides a few
values on top of the first — and is commented as such in `App.css` so it doesn't read as
the same accident. Verified by measuring the winning block at 600×500, 375×500, 320×480,
700×480, 800×650 and 1000×650.

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
  `dist/assets/*.css` after touching either. The feedback bubble's `max-height` was an
  *inline* `80dvh` with no fallback, which dodged Lightning CSS but would drop out entirely
  on an engine without `dvh` and let a long reveal overflow; it is now a
  `.feedback-bubble` class with the same base-plus-`@supports` shape. A scripted scan
  currently finds zero stacked same-property declarations in the stylesheet — keep it that
  way, and re-run it rather than trusting a reading.
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
