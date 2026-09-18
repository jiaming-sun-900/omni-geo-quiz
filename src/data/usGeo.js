import * as topojson from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";

// The shared US geometry, derived once at module load. This lives in its own
// module rather than being exported from USMap.jsx because a file that exports
// both a component and plain data breaks Vite's fast refresh (and it is data,
// not UI: the State Quiz needs the feature list without rendering a map).
//
// Excludes only the territories (AS, GU, MP, PR, VI). Alaska (02) and Hawaii
// (15) stay in: geoAlbersUsa places their geometry in the bottom-left insets,
// so they are on the map and fair game as quiz targets.
const EXCLUDED_IDS = ["60", "66", "69", "72", "78"];

export const nation = topojson.feature(usAtlas, usAtlas.objects.nation);

export const states = topojson
  .feature(usAtlas, usAtlas.objects.states)
  .features.filter((f) => !EXCLUDED_IDS.includes(f.id));
