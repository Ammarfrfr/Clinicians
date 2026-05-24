import drugs from '../data/drugs.json';

/**
 * Fuzzy search through Indian drug database.
 * Scores matches by: exact start > word start > substring > composition match
 */
export function searchDrugs(query, limit = 8) {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  const scored = drugs
    .map((drug) => {
      const name = drug.name.toLowerCase();
      const comp = drug.composition.toLowerCase();
      const brand = (drug.brand || '').toLowerCase();
      let score = 0;

      // Exact match
      if (name === q) score = 100;
      // Name starts with query
      else if (name.startsWith(q)) score = 80;
      // Brand starts with query
      else if (brand.startsWith(q)) score = 75;
      // Word in name starts with query
      else if (name.split(/[\s+&]/).some((w) => w.startsWith(q))) score = 60;
      // Name contains query
      else if (name.includes(q)) score = 50;
      // Brand contains query
      else if (brand.includes(q)) score = 40;
      // Composition contains query
      else if (comp.includes(q)) score = 30;
      // No match
      else return null;

      return { ...drug, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
