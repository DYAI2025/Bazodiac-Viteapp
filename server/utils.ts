/**
 * Shared utilities for extracting fields from loosely-typed FuFirE responses.
 */

export function pick(obj: unknown, ...path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function pickNum(obj: unknown, ...path: string[]): number | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === 'number' ? cur : undefined;
}

/** German → English element name mapping (FuFirE uses German keys) */
export const ELEMENT_DE_TO_EN: Record<string, string> = {
  Holz: 'Wood', Feuer: 'Fire', Erde: 'Earth', Metall: 'Metal', Wasser: 'Water',
};

/** German → lowercase English for ElementBalance type keys */
export const ELEMENT_DE_TO_KEY: Record<string, string> = {
  Holz: 'wood', Feuer: 'fire', Erde: 'earth', Metall: 'metal', Wasser: 'water',
};
