// Autocomplete ranking shared by the satellite modes: an entry whose code,
// name or any other field STARTS with the query ranks ahead of one that merely
// CONTAINS it, each group kept in pool order. `fields(item)` lists the strings
// to search; `toSuggestion(item)` builds the { code, label } the input shows
// (`code` is what selecting it fills in).
export function rankSuggestions(pool, query, fields, toSuggestion, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const item of pool) {
    const values = fields(item).filter(Boolean).map((v) => v.toLowerCase());
    if (values.some((v) => v.startsWith(q))) starts.push(item);
    else if (values.some((v) => v.includes(q))) contains.push(item);
  }
  return [...starts, ...contains].slice(0, limit).map(toSuggestion);
}
