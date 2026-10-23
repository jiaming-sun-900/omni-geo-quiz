import { useSyncExternalStore } from "react";
import { ROUTES, pageTitle } from "./routes";

// A router small enough to read in one go: the app has nine flat pages and no
// parameters, so the History API plus one subscription covers it.
//
// The base path (/omni-geo-quiz/) comes from Vite. Paths are compared without
// slashes at either end, so /omni-geo-quiz/world-airport and the
// /world-airport/ that GitHub Pages redirects a bare folder URL to are the
// same page.
const BASE = import.meta.env.BASE_URL;

function currentSlug() {
  const path = window.location.pathname;
  const rest = path.startsWith(BASE) ? path.slice(BASE.length) : path;
  return rest.replace(/^\/+|\/+$/g, "");
}

const listeners = new Set();
function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

// The current route, or the home route for a path that isn't one of ours.
export function useRoute() {
  const slug = useSyncExternalStore(subscribe, currentSlug);
  return ROUTES.find((r) => r.slug === slug) ?? ROUTES[0];
}

export function navigate(slug) {
  if (slug === currentSlug()) return;
  window.history.pushState(null, "", BASE + slug);
  listeners.forEach((l) => l());
  // The home page scrolls, so a mode picked from a card halfway down would
  // otherwise open the next page (About, notably) at that same offset. Back and
  // Forward don't come through here, so the browser still restores their
  // scroll position.
  window.scrollTo(0, 0);
}

// Keeps the tab title in step with the page, so history entries and bookmarks
// say which quiz they are.
export function setTitleFor(route) {
  document.title = pageTitle(route);
}
