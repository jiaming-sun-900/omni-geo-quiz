import MapStage from "../quiz/MapStage";
import { airports, matchAirport } from "../data/airports";
import { airportWikiQuery } from "../utils/reviewLinks";

export default {
  slug: "us-airport",
  pool: airports,
  Stage: MapStage,
  dot: (a) => [a.lng, a.lat],
  prompt: "Which airport is marked by the red dot?",
  // The default suggestions of the search input are this pool's.
  input: "search",
  hints: [
    // One airline reads as a sentence; several as a list.
    (a) =>
      a.hubs.length === 1
        ? `This airport is a hub for ${a.hubs[0]}.`
        : { lead: "This airport is a hub for:", items: a.hubs },
    (a) => `This airport is in ${a.state}.`,
  ],
  match: (guess, a) => matchAirport(guess, a),
  reveal: (a) => `${a.name} (${a.code}) — ${a.city}, ${a.state}`,
  review: (a) => ({
    answer: `${a.name} (${a.code}) — ${a.city}, ${a.state}`,
    wiki: airportWikiQuery(a.name),
    lat: a.lat,
    lng: a.lng,
  }),
};
