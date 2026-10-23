// The continents the world modes can be narrowed to. Plain data, because
// routes.js (and through it vite.config.js) builds a page per continent from it.
// `name` is the `region` value in the world data files.
export const REGIONS = [
  { slug: "asia", name: "Asia", short: "Asia" },
  { slug: "europe", name: "Europe", short: "Europe" },
  { slug: "north-america", name: "North America", short: "N. America" },
  { slug: "south-america", name: "South America", short: "S. America" },
  { slug: "africa", name: "Africa", short: "Africa" },
  { slug: "oceania", name: "Oceania", short: "Oceania" },
];

// The modes that can be narrowed, by slug and page title.
export const REGIONAL_MODES = [
  { slug: "world-city", title: "World City Quiz" },
  { slug: "world-airport", title: "World Airport Quiz" },
];

// A world mode restricted to one continent. Its first hint names the
// continent, which is no clue when every round is on it, so that one goes.
// The matcher still checks against the whole world pool, so naming a city on
// another continent is a wrong answer rather than an unknown one.
export function forRegion(def, region) {
  return {
    ...def,
    slug: `${def.slug}-${region.slug}`,
    pool: def.pool.filter((entry) => entry.region === region.name),
    hints: def.hints.slice(1),
  };
}
