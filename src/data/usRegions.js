import { stateAbbreviations } from "./states";

// The two US region schemes the first hint uses. They differ on purpose: the
// Airport Satellite Quiz uses Census-style regions, the City Satellite Quiz a
// finer set. Both put Alaska and Hawaii in "non-contiguous US", phrased to read
// as "This city is in the non-contiguous US."; filing them under West Coast
// gave "This airport is in the West Coast." for Honolulu.
const AIRPORT_REGIONS = {
  Northeast: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"],
  Southeast: ["DE", "MD", "VA", "WV", "NC", "SC", "GA", "FL"],
  Midwest: ["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
  South: ["TX", "OK", "AR", "LA", "MS", "AL", "TN", "KY"],
  "Western US": ["MT", "ID", "WY", "CO", "NM", "AZ", "UT", "NV"],
  "West Coast": ["WA", "OR", "CA"],
  "non-contiguous US": ["AK", "HI"],
};

const CITY_REGIONS = {
  "West Coast": ["CA", "OR", "WA"],
  Southwest: ["AZ", "NV", "NM", "UT", "CO"],
  "Mountain West": ["ID", "MT", "WY"],
  Midwest: ["IL", "IN", "OH", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
  South: ["TX", "OK", "AR", "LA", "MS", "AL", "TN", "KY", "WV"],
  Southeast: ["FL", "GA", "SC", "NC", "VA"],
  // DC sits with Maryland. Without an entry its region hint fell back to the
  // state name, "District of Columbia", which is the answer.
  Northeast: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "MD", "DE", "DC"],
  "non-contiguous US": ["AK", "HI"],
};

function lookup(regions) {
  const byAbbr = {};
  for (const [region, abbrs] of Object.entries(regions)) {
    for (const abbr of abbrs) byAbbr[abbr] = region;
  }
  // The data stores full state names; stateAbbreviations maps them, DC included.
  return (stateName) => byAbbr[stateAbbreviations[stateName]] ?? null;
}

export const airportRegionOf = lookup(AIRPORT_REGIONS);
export const cityRegionOf = lookup(CITY_REGIONS);
