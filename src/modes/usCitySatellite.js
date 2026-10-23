import SatelliteStage from "../quiz/SatelliteStage";
import { satelliteCities } from "../data/satellite-cities";
import { cityAbbreviations, matchCity } from "../data/cities";
import { cityRegionOf } from "../data/usRegions";
import { rankSuggestions } from "../utils/suggest";

const IMG_BASE = `${import.meta.env.BASE_URL}satellite/cities/`;

export default {
  slug: "us-city-satellite",
  pool: satelliteCities,
  Stage: SatelliteStage,
  image: (c) => `${IMG_BASE}${c.imageFile}`,
  imageAlt: "Satellite view of a city",
  prompt: "Which city is shown in the satellite image?",
  input: "search",
  placeholder: "City name...",
  // "City, State" doubles as the fill value (unique, so the two Portlands don't
  // collide); matchCity checks the state part.
  getSuggestions: (query) =>
    rankSuggestions(
      satelliteCities,
      query,
      (c) => [c.name, cityAbbreviations[c.name]],
      (c) => ({ code: `${c.name}, ${c.state}`, label: `${c.name}, ${c.state}` })
    ),
  hints: [
    (c) => {
      const region = cityRegionOf(c.state);
      return region ? `This city is in the ${region}.` : `This city is in ${c.state}.`;
    },
    // DC's "state" is the answer itself, so its second hint has to be a clue
    // rather than the state name.
    (c) =>
      c.name === "St. Louis"
        ? "This city is the home of the developer of this game 👨‍💻"
        : c.state === "District of Columbia"
          ? "This city is not in any state."
          : `This city is in ${c.state}.`,
  ],
  match: (guess, c) => matchCity(guess, c),
  reveal: (c) => `${c.name}, ${c.state}`,
  review: (c) => ({
    answer: `${c.name}, ${c.state}`,
    wiki: `${c.name}, ${c.state}`,
    lat: c.lat,
    lng: c.lng,
    image: `${IMG_BASE}${c.imageFile}`,
  }),
};
