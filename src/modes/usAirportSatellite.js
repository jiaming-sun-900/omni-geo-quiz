import SatelliteStage from "../quiz/SatelliteStage";
import { satelliteAirports } from "../data/satellite-airports";
import { airportRegionOf } from "../data/usRegions";
import { makeAirportMatcher } from "../utils/airportMatch";
import { airportWikiQuery } from "../utils/reviewLinks";
import { rankSuggestions } from "../utils/suggest";

const IMG_BASE = `${import.meta.env.BASE_URL}satellite/airports/`;

// Code, name, short name or, where it names a single airport, the city. See
// utils/airportMatch.js.
const matchAirport = makeAirportMatcher(satelliteAirports, "code");

export default {
  slug: "us-airport-satellite",
  pool: satelliteAirports,
  Stage: SatelliteStage,
  image: (a) => `${IMG_BASE}${a.code}.jpg`,
  imageAlt: "Satellite view of an airport",
  prompt: "Which airport is shown?",
  input: "search",
  getSuggestions: (query) =>
    rankSuggestions(
      satelliteAirports,
      query,
      (a) => [a.code, a.city, a.name],
      (a) => ({ code: a.code, label: `${a.code} — ${a.city}` })
    ),
  hints: [
    (a) => {
      const region = airportRegionOf(a.state);
      return region ? `This airport is in the ${region}.` : `This airport is in ${a.state}.`;
    },
    (a) =>
      a.code === "STL"
        ? "This airport is the home airport of the developer 👨‍💻"
        : `This airport is in ${a.state}.`,
  ],
  match: (guess, a) => matchAirport(guess, a),
  reveal: (a) => `${a.name} (${a.code}) — ${a.city}, ${a.state}`,
  review: (a) => ({
    answer: `${a.name} (${a.code}) — ${a.city}, ${a.state}`,
    wiki: airportWikiQuery(a.name),
    lat: a.lat,
    lng: a.lng,
    image: `${IMG_BASE}${a.code}.jpg`,
  }),
};
