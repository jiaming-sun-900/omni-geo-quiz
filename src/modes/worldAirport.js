import SatelliteStage from "../quiz/SatelliteStage";
import { satelliteWorldAirports } from "../data/satellite-world-airports";
import { makeAirportMatcher } from "../utils/airportMatch";
import { airportWikiQuery } from "../utils/reviewLinks";
import { rankSuggestions } from "../utils/suggest";

const IMG_BASE = `${import.meta.env.BASE_URL}satellite/world-airports/`;

// Code, name, short name ("Heathrow", "Haneda", "Pudong") or, where it names a
// single airport, the city. Beijing, Shanghai, Tokyo, Osaka and London each
// have two airports in the roster, so for those the city alone is not accepted.
const matchAirport = makeAirportMatcher(satelliteWorldAirports, "iata");

export default {
  slug: "world-airport",
  pool: satelliteWorldAirports,
  Stage: SatelliteStage,
  image: (a) => `${IMG_BASE}${a.imageFile}`,
  imageAlt: "Satellite view of an airport",
  prompt: "Which airport is shown?",
  input: "search",
  placeholder: "IATA code, airport, or city...",
  // The airport name in the label tells same-city pairs (PEK vs PKX) apart, and
  // the fill value is the IATA code, so any pick submits an unambiguous answer.
  getSuggestions: (query) =>
    rankSuggestions(
      satelliteWorldAirports,
      query,
      (a) => [a.iata, a.city, a.name],
      (a) => ({ code: a.iata, label: `${a.iata} — ${a.name}` })
    ),
  hints: [
    (a) => `This airport is in ${a.region}.`,
    (a) => `This airport is in ${a.country}.`,
    (a) => `This airport serves ${a.city}.`,
    (a) => `Its IATA code is ${a.iata}.`,
  ],
  match: (guess, a) => matchAirport(guess, a),
  reveal: (a) => `${a.name} (${a.iata}) — ${a.city}, ${a.country}`,
  review: (a) => ({
    answer: `${a.name} (${a.iata}) — ${a.city}, ${a.country}`,
    wiki: airportWikiQuery(a.name),
    lat: a.lat,
    lng: a.lng,
    image: `${IMG_BASE}${a.imageFile}`,
  }),
};
