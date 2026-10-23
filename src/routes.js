import { REGIONS, REGIONAL_MODES } from "./modes/regions.js";

// Every page with its own URL. Plain data, because two very different places
// read it: the app's router (src/router.js), and vite.config.js, which writes a
// copy of index.html into each route's folder at build time so a deep link
// like /omni-geo-quiz/world-airport loads the app on GitHub Pages instead of a
// 404. The slug is the path under the base URL; "" is the home screen.
export const ROUTES = [
  { slug: "", title: "Omni Geo Quiz" },
  { slug: "daily", title: "Daily Challenge" },
  { slug: "us-state", title: "US State Quiz" },
  { slug: "us-city", title: "US City Quiz" },
  { slug: "us-city-satellite", title: "US City Quiz (Satellite)" },
  { slug: "us-airport", title: "US Airport Quiz" },
  { slug: "us-airport-satellite", title: "US Airport Quiz (Satellite)" },
  { slug: "world-city", title: "World City Quiz" },
  { slug: "world-airport", title: "World Airport Quiz" },
  // One page per continent for each world mode: world-city-europe and so on.
  ...REGIONAL_MODES.flatMap((mode) =>
    REGIONS.map((r) => ({ slug: `${mode.slug}-${r.slug}`, title: `${mode.title}: ${r.name}` }))
  ),
  { slug: "about", title: "About" },
];

// The tab title for a route: the site name alone on the home screen, the page
// name first everywhere else so it survives a truncated tab.
export function pageTitle(route) {
  return route.slug ? `${route.title} · Omni Geo Quiz` : route.title;
}
