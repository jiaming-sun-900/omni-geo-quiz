export const cities = [
  { name: "San Francisco", lat: 37.77, lng: -122.45, state: "California" },
  { name: "Los Angeles", lat: 34.11, lng: -118.41, state: "California" },
  { name: "Sacramento", lat: 38.57, lng: -121.47, state: "California" },
  { name: "San Jose", lat: 37.30, lng: -121.85, state: "California" },
  { name: "San Diego", lat: 32.81, lng: -117.14, state: "California" },
  { name: "Portland", lat: 45.54, lng: -122.66, state: "Oregon" },
  { name: "Seattle", lat: 47.62, lng: -122.35, state: "Washington" },
  { name: "Las Vegas", lat: 36.21, lng: -115.22, state: "Nevada" },
  { name: "Phoenix", lat: 33.54, lng: -112.07, state: "Arizona" },
  { name: "Palm Springs", lat: 33.83, lng: -116.54, state: "California" },
  { name: "Albuquerque", lat: 35.12, lng: -106.62, state: "New Mexico" },
  { name: "Salt Lake City", lat: 40.76, lng: -111.89, state: "Utah" },
  { name: "Boulder", lat: 40.01, lng: -105.27, state: "Colorado" },
  { name: "Boise", lat: 43.62, lng: -116.20, state: "Idaho" },
  { name: "Denver", lat: 39.77, lng: -104.87, state: "Colorado" },
  { name: "Houston", lat: 29.74, lng: -95.46, state: "Texas" },
  { name: "Dallas", lat: 32.79, lng: -96.77, state: "Texas" },
  { name: "Austin", lat: 30.31, lng: -97.75, state: "Texas" },
  { name: "San Antonio", lat: 29.46, lng: -98.51, state: "Texas" },
  { name: "New Orleans", lat: 29.95, lng: -90.07, state: "Louisiana" },
  { name: "Little Rock", lat: 34.75, lng: -92.29, state: "Arkansas" },
  { name: "Bentonville", lat: 36.37, lng: -94.21, state: "Arkansas" },
  { name: "Oklahoma City", lat: 35.47, lng: -97.51, state: "Oklahoma" },
  { name: "Chicago", lat: 41.84, lng: -87.68, state: "Illinois" },
  { name: "Champaign", lat: 40.12, lng: -88.24, state: "Illinois" },
  { name: "St. Louis", lat: 38.63, lng: -90.20, state: "Missouri" },
  { name: "Kansas City", lat: 39.12, lng: -94.55, state: "Missouri" },
  { name: "Omaha", lat: 41.26, lng: -95.94, state: "Nebraska" },
  { name: "Minneapolis", lat: 44.98, lng: -93.27, state: "Minnesota" },
  { name: "Des Moines", lat: 41.59, lng: -93.62, state: "Iowa" },
  { name: "Indianapolis", lat: 39.78, lng: -86.15, state: "Indiana" },
  { name: "Columbus", lat: 39.99, lng: -82.99, state: "Ohio" },
  { name: "Cincinnati", lat: 39.10, lng: -84.51, state: "Ohio" },
  { name: "Cleveland", lat: 41.50, lng: -81.69, state: "Ohio" },
  { name: "Detroit", lat: 42.38, lng: -83.10, state: "Michigan" },
  { name: "Milwaukee", lat: 43.06, lng: -87.97, state: "Wisconsin" },
  { name: "Madison", lat: 43.07, lng: -89.40, state: "Wisconsin" },
  { name: "Atlanta", lat: 33.76, lng: -84.42, state: "Georgia" },
  { name: "Memphis", lat: 35.11, lng: -90.01, state: "Tennessee" },
  { name: "Nashville", lat: 36.17, lng: -86.78, state: "Tennessee" },
  { name: "Louisville", lat: 38.25, lng: -85.76, state: "Kentucky" },
  { name: "Raleigh", lat: 35.78, lng: -78.64, state: "North Carolina" },
  { name: "Charlotte", lat: 35.20, lng: -80.83, state: "North Carolina" },
  { name: "Charleston", lat: 32.78, lng: -79.94, state: "South Carolina" },
  { name: "Miami", lat: 25.77, lng: -80.19, state: "Florida" },
  { name: "Orlando", lat: 28.54, lng: -81.38, state: "Florida" },
  { name: "Tampa", lat: 27.95, lng: -82.46, state: "Florida" },
  { name: "Sarasota", lat: 27.34, lng: -82.53, state: "Florida" },
  { name: "Jacksonville", lat: 30.33, lng: -81.66, state: "Florida" },
  { name: "Key West", lat: 24.56, lng: -81.78, state: "Florida" },
  { name: "New York", lat: 40.67, lng: -73.94, state: "New York" },
  { name: "Boston", lat: 42.34, lng: -71.02, state: "Massachusetts" },
  { name: "Portland", lat: 43.66, lng: -70.26, state: "Maine" },
  { name: "Providence", lat: 41.82, lng: -71.42, state: "Rhode Island" },
  { name: "Pittsburgh", lat: 40.44, lng: -79.98, state: "Pennsylvania" },
  { name: "Philadelphia", lat: 40.01, lng: -75.13, state: "Pennsylvania" },
  { name: "Baltimore", lat: 39.30, lng: -76.61, state: "Maryland" },
  { name: "Washington DC", lat: 38.91, lng: -77.02, state: "District of Columbia" },
  { name: "Buffalo", lat: 42.89, lng: -78.88, state: "New York" },
  { name: "Anchorage", lat: 61.22, lng: -149.90, state: "Alaska" },
  { name: "Fairbanks", lat: 64.84, lng: -147.72, state: "Alaska" },
  { name: "Honolulu", lat: 21.31, lng: -157.86, state: "Hawaii" },
];

// Common abbreviations shown beside suggestions and matched in the typeahead.
export const cityAbbreviations = {
  "Washington DC": "DC",
  "New York": "NYC",
  "Los Angeles": "LA",
  "San Francisco": "SF",
  "New Orleans": "NOLA",
};

// City names that appear more than once in the list — these get a state suffix in the dropdown.
const duplicateCityNames = new Set(
  cities
    .map((c) => c.name)
    .filter((name, i, arr) => arr.indexOf(name) !== arr.lastIndexOf(name))
);

// Case-insensitive match against the city name and its abbreviation. Names (or
// abbreviations) that START with the query rank ahead of those that merely
// CONTAIN it elsewhere.
// Returns [{name, label}] where label includes "(State)" for duplicate city names.
export function getCitySuggestions(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const c of cities) {
    const name = c.name.toLowerCase();
    const abbr = cityAbbreviations[c.name]?.toLowerCase();
    if (name.startsWith(q) || abbr?.startsWith(q)) {
      starts.push(c);
    } else if (name.includes(q) || abbr?.includes(q)) {
      contains.push(c);
    }
  }
  return [...starts, ...contains].slice(0, limit).map((c) => ({
    name: c.name,
    label: duplicateCityNames.has(c.name) ? `${c.name} (${c.state})` : c.name,
  }));
}
