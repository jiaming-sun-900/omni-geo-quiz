import MapStage from "../quiz/MapStage";
import { cities, matchCity } from "../data/cities";

export default {
  slug: "us-city",
  pool: cities,
  Stage: MapStage,
  dot: (c) => [c.lng, c.lat],
  prompt: "Which city is the red dot in?",
  input: "city",
  hints: [],
  match: (guess, c) => matchCity(guess, c),
  reveal: (c) => `${c.name}, ${c.state}`,
  review: (c) => ({
    answer: `${c.name}, ${c.state}`,
    // Wikipedia redirects "Denver, Colorado" to "Denver", so the City, State
    // form resolves for both naming conventions.
    wiki: `${c.name}, ${c.state}`,
    lat: c.lat,
    lng: c.lng,
  }),
};
