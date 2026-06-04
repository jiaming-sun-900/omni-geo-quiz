import { fuzzyMatch } from "../utils/fuzzyMatch";

export const airports = [
  // United Airlines hubs
  { code: "ORD", name: "O'Hare International", city: "Chicago", lat: 41.9742, lng: -87.9073, state: "Illinois", hubs: ["United Airlines", "American Airlines", "Frontier Airlines (focus city)"] },
  { code: "DEN", name: "Denver International", city: "Denver", lat: 39.8561, lng: -104.6737, state: "Colorado", hubs: ["United Airlines", "Southwest Airlines (focus city)", "Frontier Airlines"] },
  { code: "IAH", name: "Bush Intercontinental", city: "Houston", lat: 29.9902, lng: -95.3368, state: "Texas", hubs: ["United Airlines"] },
  { code: "LAX", name: "Los Angeles International", city: "Los Angeles", lat: 33.9425, lng: -118.4081, state: "California", hubs: ["United Airlines", "American Airlines", "Delta Air Lines", "Alaska Airlines", "Southwest Airlines (focus city)"] },
  { code: "EWR", name: "Newark Liberty International", city: "Newark", lat: 40.6895, lng: -74.1745, state: "New Jersey", hubs: ["United Airlines"] },
  { code: "SFO", name: "San Francisco International", city: "San Francisco", lat: 37.6213, lng: -122.3790, state: "California", hubs: ["United Airlines", "Alaska Airlines"] },
  { code: "IAD", name: "Dulles International", city: "Washington", lat: 38.9531, lng: -77.4565, state: "Virginia", hubs: ["United Airlines"] },
  // Delta hubs
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", lat: 33.6407, lng: -84.4277, state: "Georgia", hubs: ["Delta Air Lines", "Southwest Airlines (focus city)"] },
  { code: "BOS", name: "Logan International", city: "Boston", lat: 42.3656, lng: -71.0096, state: "Massachusetts", hubs: ["Delta Air Lines"] },
  { code: "DTW", name: "Detroit Metropolitan", city: "Detroit", lat: 42.2162, lng: -83.3554, state: "Michigan", hubs: ["Delta Air Lines"] },
  { code: "MSP", name: "Minneapolis-Saint Paul International", city: "Minneapolis", lat: 44.8848, lng: -93.2223, state: "Minnesota", hubs: ["Delta Air Lines", "Southwest Airlines (focus city)"] },
  { code: "JFK", name: "John F. Kennedy International", city: "New York", lat: 40.6413, lng: -73.7781, state: "New York", hubs: ["Delta Air Lines", "American Airlines"] },
  { code: "LGA", name: "LaGuardia Airport", city: "New York", lat: 40.7769, lng: -73.8740, state: "New York", hubs: ["Delta Air Lines", "American Airlines"] },
  { code: "SLC", name: "Salt Lake City International", city: "Salt Lake City", lat: 40.7899, lng: -111.9791, state: "Utah", hubs: ["Delta Air Lines"] },
  { code: "SEA", name: "Seattle-Tacoma International", city: "Seattle", lat: 47.4502, lng: -122.3088, state: "Washington", hubs: ["Delta Air Lines", "Alaska Airlines"] },
  // American Airlines hubs
  { code: "CLT", name: "Charlotte Douglas International", city: "Charlotte", lat: 35.2144, lng: -80.9473, state: "North Carolina", hubs: ["American Airlines"] },
  { code: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", lat: 32.8998, lng: -97.0403, state: "Texas", hubs: ["American Airlines"] },
  { code: "MIA", name: "Miami International", city: "Miami", lat: 25.7959, lng: -80.2870, state: "Florida", hubs: ["American Airlines"] },
  { code: "PHL", name: "Philadelphia International", city: "Philadelphia", lat: 39.8744, lng: -75.2424, state: "Pennsylvania", hubs: ["American Airlines"] },
  { code: "PHX", name: "Phoenix Sky Harbor International", city: "Phoenix", lat: 33.4373, lng: -112.0078, state: "Arizona", hubs: ["American Airlines", "Southwest Airlines (focus city)"] },
  { code: "DCA", name: "Ronald Reagan Washington National", city: "Washington", lat: 38.8521, lng: -77.0377, state: "Virginia", hubs: ["American Airlines"] },
  // Alaska Airlines
  { code: "ANC", name: "Ted Stevens Anchorage International", city: "Anchorage", lat: 61.1743, lng: -149.9963, state: "Alaska", hubs: ["Alaska Airlines"] },
  { code: "PDX", name: "Portland International", city: "Portland", lat: 45.5898, lng: -122.5951, state: "Oregon", hubs: ["Alaska Airlines"] },
  // Southwest focus cities and Frontier bases
  { code: "BWI", name: "Baltimore/Washington International", city: "Baltimore", lat: 39.1754, lng: -76.6683, state: "Maryland", hubs: ["Southwest Airlines (focus city)"] },
  { code: "MDW", name: "Chicago Midway International", city: "Chicago", lat: 41.7868, lng: -87.7522, state: "Illinois", hubs: ["Southwest Airlines (focus city)"] },
  { code: "DAL", name: "Dallas Love Field", city: "Dallas", lat: 32.8471, lng: -96.8517, state: "Texas", hubs: ["Southwest Airlines (focus city)"] },
  { code: "HOU", name: "William P. Hobby Airport", city: "Houston", lat: 29.6454, lng: -95.2789, state: "Texas", hubs: ["Southwest Airlines (focus city)"] },
  { code: "LAS", name: "Harry Reid International", city: "Las Vegas", lat: 36.0840, lng: -115.1537, state: "Nevada", hubs: ["Southwest Airlines (focus city)", "Frontier Airlines (focus city)"] },
  { code: "MCO", name: "Orlando International", city: "Orlando", lat: 28.4312, lng: -81.3081, state: "Florida", hubs: ["Southwest Airlines (focus city)", "Frontier Airlines (focus city)"] },
  { code: "BNA", name: "Nashville International", city: "Nashville", lat: 36.1245, lng: -86.6782, state: "Tennessee", hubs: ["Southwest Airlines (focus city)"] },
  { code: "CLE", name: "Cleveland Hopkins International", city: "Cleveland", lat: 41.4117, lng: -81.8498, state: "Ohio", hubs: ["Frontier Airlines (focus city)"] },
  // Additional focus cities and regional hubs
  { code: "HNL", name: "Daniel K. Inouye International", city: "Honolulu", lat: 21.3245, lng: -157.9251, state: "Hawaii", hubs: ["Alaska Airlines", "Hawaiian Airlines (now part of Alaska Air Group)"] },
  { code: "SAT", name: "San Antonio International", city: "San Antonio", lat: 29.5337, lng: -98.4698, state: "Texas", hubs: ["Southwest Airlines (focus city)"] },
  { code: "AUS", name: "Austin-Bergstrom International", city: "Austin", lat: 30.1975, lng: -97.6664, state: "Texas", hubs: ["Southwest Airlines (operating base)", "Delta Air Lines (focus city)"] },
  { code: "RDU", name: "Raleigh-Durham International", city: "Raleigh", lat: 35.8776, lng: -78.7875, state: "North Carolina", hubs: ["Delta Air Lines (focus city)"] },
  { code: "CVG", name: "Cincinnati/Northern Kentucky International", city: "Cincinnati", lat: 39.0489, lng: -84.6678, state: "Kentucky", hubs: ["Delta Air Lines (former hub, major focus city)"] },
];

// Generic words stripped from the airport name to derive a short, recognizable
// label (e.g. "Hartsfield-Jackson Atlanta International" -> "Hartsfield-Jackson").
const GENERIC_WORDS = [
  "International",
  "Intercontinental",
  "Metropolitan",
  "Regional",
  "Memorial",
  "National",
  "Airport",
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A trimmed display name: full name with the city and generic descriptor words
// removed. Returns "" when nothing distinctive remains (e.g. "Denver International").
function shortName(airport) {
  let s = airport.name.replace(new RegExp(`\\b${escapeRegex(airport.city)}\\b`, "ig"), " ");
  for (const w of GENERIC_WORDS) {
    s = s.replace(new RegExp(`\\b${w}\\b`, "ig"), " ");
  }
  return s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[-/\s]+|[-/\s]+$/g, "")
    .trim();
}

// Dropdown label, e.g. "ATL — Atlanta (Hartsfield-Jackson)" or, when no
// distinctive short name exists, simply "DEN — Denver".
export function airportLabel(airport) {
  const sn = shortName(airport);
  return sn ? `${airport.code} — ${airport.city} (${sn})` : `${airport.code} — ${airport.city}`;
}

// Case-insensitive suggestions matched against the IATA code, city, or full
// airport name. Matches that START with the query rank ahead of those that
// merely CONTAIN it. Returns [{ code, label }].
export function getAirportSuggestions(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const a of airports) {
    const code = a.code.toLowerCase();
    const city = a.city.toLowerCase();
    const name = a.name.toLowerCase();
    if (code.startsWith(q) || city.startsWith(q) || name.startsWith(q)) {
      starts.push(a);
    } else if (code.includes(q) || city.includes(q) || name.includes(q)) {
      contains.push(a);
    }
  }
  return [...starts, ...contains].slice(0, limit).map((a) => ({
    code: a.code,
    label: airportLabel(a),
  }));
}

// Accept the exact IATA code, or the city name / full airport name with the
// shared fuzzy matcher (case-insensitive, typo tolerant).
export function matchAirport(guess, airport) {
  if (guess.trim().toLowerCase() === airport.code.toLowerCase()) return true;
  if (fuzzyMatch(guess, airport.city)) return true;
  if (fuzzyMatch(guess, airport.name)) return true;
  return false;
}
