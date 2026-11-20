import type { SongRow } from './catalog/rows';
import { CATALOG_SONGS } from './catalog';
import { compact, similarity } from '../lib/fuzzy';

export interface Song {
  title: string;
  artists: string[];
  genre?: string;
}

export const SONGS: Song[] = dedupe(CATALOG_SONGS).map(([title, artists, genre]) => ({ title, artists, genre }));

function dedupe(rows: SongRow[]): SongRow[] {
  const seen = new Set<string>();
  return rows.filter(([t, a]) => {
    const k = `${compact(t)}|${compact(a[0] ?? '')}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const BY_TITLE = new Map<string, Song[]>();
for (const s of SONGS) {
  const k = compact(s.title);
  if (!BY_TITLE.has(k)) BY_TITLE.set(k, []);
  BY_TITLE.get(k)!.push(s);
}
const TITLE_KEYS = [...BY_TITLE.keys()];

/**
 * Find a catalogue song by (OCR'd) title. With `artistHint`, prefer the version by that artist
 * and only fuzzy-match within that artist's songs, since many titles are shared.
 */
export function findSong(title: string, artistHint?: string): Song | undefined {
  const key = compact(title);
  if (key.length < 2) return undefined;
  const pick = (list: Song[]) => (artistHint ? list.find((s) => s.artists.includes(artistHint)) : list.length === 1 ? list[0] : list[0]);

  const exact = BY_TITLE.get(key);
  if (exact) {
    const s = pick(exact);
    if (s || !artistHint) return s;
  }
  // Fuzzy: short titles must be exact; longer ones tolerate OCR slips.
  if (key.length < 6) return undefined;
  let best: { s: Song; score: number } | undefined;
  for (const k of TITLE_KEYS) {
    if (Math.abs(k.length - key.length) > 3) continue;
    const score = similarity(key, k);
    if (score < 0.86) continue;
    const s = pick(BY_TITLE.get(k)!);
    if (s && (!best || score > best.score)) best = { s, score };
  }
  return best?.s;
}
