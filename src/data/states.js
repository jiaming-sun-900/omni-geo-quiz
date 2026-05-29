import { fuzzyMatch } from "../utils/fuzzyMatch";

export const stateAbbreviations = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District of Columbia": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

export const allStateNames = Object.keys(stateAbbreviations);

export function matchesState(guess, stateName) {
  const stripped = guess.toLowerCase().replace(/[^a-z]/g, "");
  const abbr = stateAbbreviations[stateName];
  if (abbr && stripped === abbr.toLowerCase()) return true;
  return fuzzyMatch(guess, stateName);
}

// Names (or abbreviations) that START with the query rank ahead of those that
// merely CONTAIN it elsewhere.
export function getStateSuggestions(query, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const name of allStateNames) {
    const n = name.toLowerCase();
    const abbr = stateAbbreviations[name].toLowerCase();
    if (n.startsWith(q) || abbr.startsWith(q)) {
      starts.push(name);
    } else if (n.includes(q) || abbr.includes(q)) {
      contains.push(name);
    }
  }
  return [...starts, ...contains].slice(0, limit);
}
