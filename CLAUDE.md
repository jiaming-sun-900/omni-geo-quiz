# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

US Geo Quiz — a React + D3.js quiz app with two game modes (State Quiz, City Quiz) testing US geography knowledge. No backend; deployable to GitHub Pages.

## Commands

- `npm run dev` — start Vite dev server (serves at `/us-geo-quiz/` base path)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build locally

## Stack

- **React** (via Vite, no TypeScript)
- **D3.js** — `d3-geo` (AlbersUsa projection), `d3-selection` for SVG rendering
- **us-atlas** — `states-10m.json` TopoJSON (provides `states` and `nation` objects)
- **topojson-client** — converts TopoJSON to GeoJSON features
- **point-in-polygon** — validates random points land inside the correct state geometry

## Architecture

**App.jsx** manages a single `mode` state (`null` | `"state"` | `"city"`) to switch between HomeScreen and quiz components.

**USMap.jsx** is the shared map component used by both quiz modes. It renders an SVG with:
- All continental US state paths filled white with white stroke (no visible state borders)
- A single national border outline (dark stroke)
- An optional red dot at `dotPosition` (projected via AlbersUsa)
- Optional green highlight on a revealed state via `revealedStateId`

It exports `states` (filtered GeoJSON features excluding AK, HI, and territories) for use by StateQuiz.

**StateQuiz.jsx / CityQuiz.jsx** follow the same pattern: a wrapper component holds `gameKey` and `finalScore`, and a `Game` inner component handles round logic. Incrementing `gameKey` remounts `Game` for a clean restart. Each game runs 10 rounds, tracks score, and calls `onFinish(score)` to show ResultsScreen.

**State Quiz point generation** (`utils/randomPoint.js`): picks the largest polygon of a state by bounding-box area, shrinks bounds by 10%, and rejection-samples up to 1000 times using point-in-polygon to guarantee the dot falls inside the state.

**Fuzzy matching** (`utils/fuzzyMatch.js`): normalizes input (lowercase, strip punctuation), checks common abbreviations (DC, NYC, LA, etc.), then falls back to Levenshtein distance with a 25%-of-answer-length threshold.

**City data** (`data/cities.js`): 52 hardcoded US cities with `{name, lat, lng, state}`. Coordinates are approximate city centers. This is the authoritative city list — add/remove entries here to change the City Quiz pool.

## GitHub Pages Deployment

`vite.config.js` sets `base: "/us-geo-quiz/"` for GitHub Pages. The repo name must match this base path.
