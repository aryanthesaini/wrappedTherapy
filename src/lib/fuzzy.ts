import type { Artist } from '../types';
import { ARTISTS } from '../data/artists';

/** lowercase, strip accents, keep letters/digits only. */
export const compact = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export const similarity = (a: string, b: string) => 1 - levenshtein(a, b) / Math.max(a.length, b.length, 1);

/** Common OCR confusions, applied to the OCR side before comparing. */
const OCR_FIXES: [RegExp, string][] = [
  [/0/g, 'o'],
  [/1/g, 'i'],
  [/5/g, 's'],
  [/\$/g, 's'],
];
const ocrNormalize = (k: string) => OCR_FIXES.reduce((s, [re, r]) => s.replace(re, r), k);

interface Entry { artist: Artist; key: string; keyFixed: string }
const ENTRIES: Entry[] = ARTISTS.flatMap((artist) =>
  [artist.name, ...(artist.aliases ?? [])].map((n) => ({ artist, key: compact(n), keyFixed: ocrNormalize(compact(n)) })),
);

/** Short names are easy to hit by accident ("KK", "BTS", "Tool"), so they must match exactly. */
const threshold = (len: number) => (len <= 4 ? 1 : len <= 7 ? 0.84 : 0.8);

export interface ArtistMatch { artist: Artist; score: number }

export function matchArtist(text: string): ArtistMatch | null {
  const key = compact(text);
  if (key.length < 2 || key.length > 40) return null;
  const keyFixed = ocrNormalize(key);
  let best: ArtistMatch | null = null;
  for (const e of ENTRIES) {
    if (Math.abs(e.key.length - key.length) > Math.max(2, Math.ceil(e.key.length * 0.25))) continue;
    const score = Math.max(similarity(key, e.key), similarity(keyFixed, e.keyFixed));
    if (score >= threshold(e.key.length) && (!best || score > best.score)) best = { artist: e.artist, score };
  }
  return best;
}
