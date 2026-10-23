import SatelliteStage from "../quiz/SatelliteStage";
import {
  satelliteWorldCities,
  worldCityAbbreviations,
  matchWorldCity,
} from "../data/satellite-world-cities";
import { rankSuggestions } from "../utils/suggest";

const IMG_BASE = `${import.meta.env.BASE_URL}satellite/world-cities/`;

export default {
  slug: "world-city",
  pool: satelliteWorldCities,
  Stage: SatelliteStage,
  image: (c) => `${IMG_BASE}${c.imageFile}`,
  imageAlt: "Satellite view of a city",
  prompt: "Which city is shown in the satellite image?",
  input: "search",
  placeholder: "City name...",
  // "City, Country" is the fill value; matchWorldCity strips the country.
  getSuggestions: (query) =>
    rankSuggestions(
      satelliteWorldCities,
      query,
      (c) => [c.name, worldCityAbbreviations[c.name]],
      (c) => ({ code: `${c.name}, ${c.country}`, label: `${c.name}, ${c.country}` })
    ),
  hints: [
    (c) => `This city is in ${c.region}.`,
    (c) => `This city is in ${c.country}.`,
    // Multi-word names use the first letter of the first word (Cape Town → C).
    (c) => `The city's name starts with "${c.name.trim()[0].toUpperCase()}".`,
    (c) => c.funFact,
  ],
  match: (guess, c) => matchWorldCity(guess, c),
  reveal: (c) => `${c.name}, ${c.country}`,
  review: (c) => ({
    answer: `${c.name}, ${c.country}`,
    // Bare name, not "City, Country": Wikipedia titles world cities by name
    // alone ("Paris", "Cairo"), and these are prominent enough not to collide.
    wiki: c.name,
    lat: c.lat,
    lng: c.lng,
    image: `${IMG_BASE}${c.imageFile}`,
  }),
};
