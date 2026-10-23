import MapStage from "../quiz/MapStage";
import { states } from "../data/usGeo";
import { matchesState } from "../data/states";
import { getRandomPointInState } from "../utils/randomPoint";

// Wikipedia resolves a bare state name for 48 of the 50 (it redirects e.g.
// "New York" to "New York (state)"). These two are disambiguation pages instead,
// so the review link spells out the article title.
const WIKI_TITLE = {
  Georgia: "Georgia (U.S. state)",
  Washington: "Washington (state)",
};

export default {
  slug: "us-state",
  // The District of Columbia (FIPS 11) is drawn on the map but never asked. It
  // is not a state, and at map scale it is unanswerable anyway: projected onto
  // the widest desktop map it measures 5.2 x 6.3px, so the red dot sitting on it
  // also covers Maryland and Virginia and the three are indistinguishable.
  pool: states.filter((s) => s.id !== "11"),
  // A fresh random point inside the state every time it is picked.
  prepare: (state) => ({ state, point: getRandomPointInState(state) }),
  Stage: MapStage,
  dot: (t) => t.point,
  revealStateId: (t) => t.state.id,
  prompt: "Which state is the red dot in?",
  input: "state",
  hints: [],
  match: (guess, t) => matchesState(guess, t.state.properties.name),
  reveal: (t) => t.state.properties.name,
  review: (t) => ({
    answer: t.state.properties.name,
    wiki: WIKI_TITLE[t.state.properties.name] || t.state.properties.name,
    lng: t.point[0],
    lat: t.point[1],
    // The coordinates are a random point inside the state, not a landmark, so
    // the default city-level zoom would open on an arbitrary field. Zoom 6
    // frames the whole state instead.
    zoom: 6,
  }),
};
