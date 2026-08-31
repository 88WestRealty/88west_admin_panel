/**
 * Small immutable helpers for reconciling realtime payloads against the
 * in-memory store. Every one returns a new array so referential equality
 * still drives React's re-render decisions.
 */

export const upsertById = <T extends { id: string }>(items: readonly T[], next: T): T[] => {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) return [next, ...items];
  const copy = items.slice();
  copy[index] = next;
  return copy;
};

export const removeById = <T extends { id: string }>(items: readonly T[], id: string): T[] =>
  items.filter((item) => item.id !== id);

export const sortBy = <T>(items: readonly T[], key: (item: T) => string | number, dir: 'asc' | 'desc' = 'asc'): T[] =>
  items.slice().sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    const cmp = x < y ? -1 : x > y ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });

/** Case/diacritic-insensitive substring match for the vendor search box. */
export const matchesQuery = (haystack: string, query: string): boolean =>
  normalize(haystack).includes(normalize(query));

const normalize = (value: string): string =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
