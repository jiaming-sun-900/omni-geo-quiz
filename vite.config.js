import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/omni-geo-quiz/",
  // Use Lightning CSS so vendor prefixes are generated correctly. The default
  // esbuild CSS minifier collapses a hand-written `backdrop-filter` +
  // `-webkit-backdrop-filter` pair down to just the -webkit form, which breaks
  // the modal blur in Firefox (it only supports the unprefixed property). With
  // Lightning CSS we author the standard property only and let these targets
  // emit the -webkit- prefix while keeping the standard one (Firefox 103+).
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
