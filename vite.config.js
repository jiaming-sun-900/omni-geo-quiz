import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ROUTES, pageTitle } from "./src/routes.js";

// GitHub Pages serves files, not an app: a deep link to /omni-geo-quiz/world-airport
// finds no file there and gets a 404. So after the build, write a copy of
// index.html into a folder per route (each with its own <title> and og:title,
// and og:url, which is also what a link preview reads, since crawlers don't run the app), and
// a 404.html copy that catches anything else and lets the router send it home.
// The asset URLs in index.html are absolute (they carry the base), so the same
// file works at any depth.
function routePages() {
  return {
    name: "route-pages",
    apply: "build",
    writeBundle(options) {
      const html = readFileSync(join(options.dir, "index.html"), "utf8");
      const titled = (route) =>
        html
          .replace(/<title>[^<]*<\/title>/, `<title>${pageTitle(route)}</title>`)
          .replace(
            /(<meta property="og:title" content=")[^"]*(")/,
            `$1${pageTitle(route)}$2`
          )
          // og:url in index.html is the site root; each copy names its own page.
          .replace(/(<meta property="og:url" content="[^"]*)(")/, `$1${route.slug}/$2`);
      for (const route of ROUTES) {
        if (!route.slug) continue;
        mkdirSync(join(options.dir, route.slug), { recursive: true });
        writeFileSync(join(options.dir, route.slug, "index.html"), titled(route));
      }
      writeFileSync(join(options.dir, "404.html"), html);
    },
  };
}

export default defineConfig({
  plugins: [react(), routePages()],
  base: "/omni-geo-quiz/",
  // Use Lightning CSS so vendor prefixes are generated correctly. The default
  // esbuild CSS minifier collapses a hand-written `backdrop-filter` +
  // `-webkit-backdrop-filter` pair down to just the -webkit form, which broke
  // the old mode chooser's blur in Firefox (it only supports the unprefixed
  // property). With Lightning CSS we author the standard property only and let
  // these targets emit the prefix while keeping the standard one.
  css: {
    transformer: "lightningcss",
    lightningcss: {
      targets: {
        safari: 12 << 16,
        firefox: 103 << 16,
        chrome: 90 << 16,
      },
    },
  },
  build: {
    cssMinify: "lightningcss",
  },
});
