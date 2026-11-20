import type { Platform, WrappedData } from '../types';
import { compact, matchArtist } from './fuzzy';
import { findSong, songsByTitle } from '../data/songs';

/**
 * Turns OCR lines (text + position) into WrappedData, and decides whether the
 * image is a music recap at all. Pure function: no browser APIs, easy to test.
 */

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

type Section = 'artists' | 'songs' | 'genre' | 'minutes' | 'none';

export interface MatchedLine { line: string; artist: string; score: number; section: Section }

export interface Diagnostics {
  rawText: string;
  meanConfidence: number;
  keywordHits: string[];
  headings: string[];
  matched: MatchedLine[];
  unknown: string[];
  songMode?: 'paired' | 'titles-only' | 'catalog-scan';
  pass?: string;
}

export type RejectKind = 'invalid_file' | 'not_recap' | 'no_artists' | 'unreadable';

export type ParseResult =
  | { ok: true; data: WrappedData; diag: Diagnostics }
  | { ok: false; kind: RejectKind; title: string; message: string; partial?: WrappedData; diag?: Diagnostics };

const HEADINGS: [RegExp, Section][] = [
  [/\btop\s*artists?\b/i, 'artists'],
  [/\b(top|most\s*played)\s*(songs?|tracks?)\b/i, 'songs'],
  [/\btop\s*genres?\b/i, 'genre'],
  [/\bminutes?\s*(listened|streamed)\b|\blistening\s*time\b/i, 'minutes'],
];

/** Phrases that show up on recap cards. A bare year doesn't count. */
const KEYWORDS: [RegExp, string][] = [
  [/\bwrapped\b/i, 'wrapped'],
  [/\brecap\b/i, 'recap'],
  [/\breplay\b/i, 'replay'],
  [/\bdelivered\b/i, 'delivered'],
  [/\btop\s*artists?\b/i, 'top artists'],
  [/\btop\s*(songs?|tracks?)\b/i, 'top songs'],
  [/\btop\s*genres?\b/i, 'top genre'],
  [/\bminutes?\s*(listened|streamed)\b/i, 'minutes listened'],
  [/\btotal\s*listens\b/i, 'total listens'],
  [/\bspotify\b/i, 'spotify'],
  [/\byoutube\s*music\b/i, 'youtube music'],
  [/\bapple\s*music\b/i, 'apple music'],
  [/\bamazon\s*music\b/i, 'amazon music'],
  [/\byour\s*top\b|\bmy\s*top\b/i, 'your top'],
];

const PLATFORM_HINTS: [RegExp, Platform][] = [
  [/spotify|wrapped/i, 'spotify'],
  [/youtube|yt\s*music|recap/i, 'youtube'],
  [/apple|replay/i, 'apple'],
  [/amazon|delivered/i, 'amazon'],
];

/** Rank prefix: only 1–10, so titles like "52 Bars" or "295" keep their number. */
const RANK_PREFIX = /^[|»«©®•·*>\-–—_.,:;'"`~\s]*#?\s*(10|[1-9])\s*[.)\]:-]?\s+(?=\S)/;
const COUNT_LINE = /^\s*[\d.,]+\s*(k|m)?\s*(total\s*)?(plays?|streams?|listens?|minutes?|mins?|hours?|hrs?|times?)\b/i;
const COUNT_SUFFIX = /\s*[·•|–—-]?\s*[\d.,]+\s*(k|m)?\s*(total\s*)?(plays?|streams?|listens?|minutes?|mins?|hours?|hrs?|times?)\b.*$/i;

/** Strip rank numbers, play counts and OCR junk from the ends of a line. */
export function cleanLine(raw: string) {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (COUNT_LINE.test(text)) return { cleaned: '', numbered: false };
  const numbered = RANK_PREFIX.test(text);
  const cleaned = text
    .replace(RANK_PREFIX, '')
    .replace(COUNT_SUFFIX, '')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.!?)']+$/gu, '')
    .trim();
  return { cleaned, numbered };
}

/** Try the whole line, then each part split on common separators ("Song · Artist"). */
function matchLine(text: string) {
  const whole = matchArtist(text);
  if (whole) return whole;
  for (const part of text.split(/\s+[·•|–—-]\s+/)) {
    const m = matchArtist(part);
    if (m) return m;
  }
  // Leading words only, longest first: handles "Pink Floyd 812 plays" or trailing OCR junk.
  const words = text.split(' ');
  if (words.length > 6) return null;
  for (let n = words.length - 1; n >= 1; n--) {
    const m = matchArtist(words.slice(0, n).join(' '));
    // Short names ("King", "fun.", "Jal") only count when they are the whole line, never a prefix.
    if (m && compact(m.artist.name).length > 4) return m;
  }
  return null;
}

/**
 * A credit line like "Seedhe Maut, Hurricane and DL91 Era" → known artists in order.
 * The whole line is tried first so names containing "&" / "and" still match.
 */
export function parseCredits(text: string): { known: string[]; parts: string[] } {
  const whole = matchArtist(text);
  if (whole) return { known: [whole.artist.name], parts: [text] };
  const parts = text
    .split(/\s*,\s*|\s+(?:and|aur|&|x|×|feat\.?|ft\.?|with)\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const known: string[] = [];
  for (const p of parts) {
    const m = matchArtist(p);
    if (m && !known.includes(m.artist.name)) known.push(m.artist.name);
  }
  return { known, parts };
}

const looksLikeName = (s: string) =>
  s.length >= 2 && s.length <= 40 && s.split(/\s+/).length <= 5 && /\p{L}/u.test(s) && !/https?:|www\.|@/.test(s) &&
  !KEYWORDS.some(([re]) => re.test(s));

/** Real titles have a few letters; OCR noise from album art ("wl", "/1", "W,") doesn't. */
const looksLikeTitle = (s: string, confidence: number) =>
  s.length <= 60 && (s.match(/\p{L}/gu)?.length ?? 0) >= 3 && confidence >= 50 && !/https?:|www\.|\.com\b/.test(s) &&
  !KEYWORDS.some(([re]) => re.test(s));

export function extractWrapped(lines: OcrLine[], fallbackPlatform: Platform): ParseResult {
  const usable = lines.filter((l) => l.text.trim() && l.confidence >= 15);
  const rawText = usable.map((l) => l.text.trim()).join('\n');
  const meanConfidence = usable.length ? usable.reduce((a, l) => a + l.confidence, 0) / usable.length : 0;
  const keywordHits = KEYWORDS.filter(([re]) => re.test(rawText)).map(([, k]) => k);

  // ── locate section headings ──
  const headingLines = usable
    .map((l) => ({ l, section: HEADINGS.find(([re]) => re.test(l.text))?.[1] }))
    .filter((h): h is { l: OcrLine; section: Section } => !!h.section);
  const isHeading = (l: OcrLine) => headingLines.some((h) => h.l === l);

  /** Nearest heading above the line, preferring the same column. */
  const sectionOf = (l: OcrLine): Section => {
    let best: { section: Section; cost: number } | null = null;
    for (const h of headingLines) {
      if (h.l === l) return 'none';
      const dy = l.bbox.y0 - h.l.bbox.y0;
      if (dy <= 0) continue;
      const cost = dy + 2 * Math.abs(l.bbox.x0 - h.l.bbox.x0);
      if (!best || cost < best.cost) best = { section: h.section, cost };
    }
    return best?.section ?? 'none';
  };

  const ordered = [...usable].sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
  const hasSections = headingLines.some((h) => h.section === 'artists' || h.section === 'songs');
  const sectionLines = (s: Section) => ordered.filter((l) => !isHeading(l) && (hasSections ? sectionOf(l) : 'artists') === s);

  const artists: string[] = [];
  const unknown: string[] = [];
  const matched: MatchedLine[] = [];
  let numberedLines = 0;
  const pushArtist = (name: string) => {
    if (!artists.includes(name) && artists.length < 10) artists.push(name);
  };

  // ── artists section ──
  for (const l of sectionLines('artists')) {
    const { cleaned, numbered } = cleanLine(l.text);
    if (!cleaned) continue;
    if (numbered) numberedLines++;
    const m = matchLine(cleaned);
    if (m) {
      pushArtist(m.artist.name);
      matched.push({ line: l.text.trim(), artist: m.artist.name, score: m.score, section: 'artists' });
    } else if (hasSections && numbered && looksLikeName(cleaned)) {
      unknown.push(cleaned);
      pushArtist(cleaned);
    }
  }

  // ── songs section ──
  let { songs, mode: songMode } = extractSongs(sectionLines('songs'), matched);
  numberedLines += sectionLines('songs').filter((l) => cleanLine(l.text).numbered).length;

  // ── genre ──
  const genreLine = sectionLines('genre').map((l) => cleanLine(l.text).cleaned).find((t) => t && t.length <= 30);

  // ── minutes, year, platform ──
  const minutesMatch =
    rawText.match(/(\d{1,3}(?:[,.\s]\d{3})+|\d{3,6})\s*(minutes|mins)\b/i) ??
    (() => {
      const h = headingLines.find((x) => x.section === 'minutes');
      const below = h && ordered.find((l) => l.bbox.y0 > h.l.bbox.y0 && /^\s*[\d.,\s]{3,9}\s*$/.test(l.text));
      return below ? [below.text, below.text] : null;
    })();
  const minutes = minutesMatch ? parseInt(String(minutesMatch[1]).replace(/[^\d]/g, ''), 10) : undefined;
  const minutesListened = minutes && minutes >= 60 && minutes <= 600000 ? minutes : undefined;
  const years = [...rawText.matchAll(/\b(20[2-3]\d)\b/g)].map((m) => +m[1]);
  const year = years.length ? Math.max(...years) : new Date().getFullYear();
  const platform = PLATFORM_HINTS.find(([re]) => re.test(rawText))?.[1] ?? fallbackPlatform;

  const known0 = matched.filter((m) => m.section === 'artists').length;
  if (known0 === 0 && !songs.some((s) => s.artist)) {
    // Last resort: no artist we know anywhere. Look every line up as a song title in the catalogue.
    const recapish = keywordHits.length > 0 || hasSections;
    const found = scanForSongs(ordered.filter((l) => !isHeading(l)), matched);
    if (found.length >= (recapish ? 1 : 3)) {
      songs = found;
      songMode = 'catalog-scan';
    }
  }
  const known = known0;
  const songArtists = songs.filter((s) => s.artist).length;

  // A songs-only card: rank artists by how often (and how high) they appear in the songs.
  if (known === 0 && songArtists > 0) {
    const tally = new Map<string, number>();
    songs.forEach((s, i) => {
      const w = 1 / (1 + 0.3 * i);
      if (s.artist) tally.set(s.artist, (tally.get(s.artist) ?? 0) + w);
    });
    [...tally.entries()].sort((a, b) => b[1] - a[1]).forEach(([name]) => pushArtist(name));
  }

  const data: WrappedData = { platform, year, topArtists: artists, topSongs: songs.slice(0, 10), topGenre: genreLine, minutesListened };
  const diag: Diagnostics = {
    rawText,
    meanConfidence: Math.round(meanConfidence),
    keywordHits,
    headings: headingLines.map((h) => h.l.text.trim()),
    matched,
    unknown,
    songMode: songs.length ? songMode : undefined,
  };

  // ── is this actually a recap? ──
  if (rawText.replace(/\s/g, '').length < 12) {
    return { ok: false, kind: 'not_recap', title: 'There\'s barely any text here.', message: 'We need a screenshot with your top artists or songs written on it.', diag };
  }
  const recapLike = keywordHits.length > 0 || hasSections || (songMode === 'catalog-scan' && songArtists >= 3);

  if (!recapLike) {
    // No recap wording at all: only accept a tight, numbered list of artists we know (e.g. a cropped card).
    if (known >= 3 && numberedLines >= 3) return { ok: true, data, diag };
    return {
      ok: false,
      kind: 'not_recap',
      title: 'That doesn\'t look like a music recap.',
      message: 'We\'re looking for your Spotify Wrapped, YouTube Music Recap, Apple Music Replay or Amazon Music Delivered. Try the top artists card.',
      diag,
    };
  }
  if (known === 0 && songArtists === 0) {
    if (meanConfidence < 45) {
      return { ok: false, kind: 'unreadable', title: 'We can\'t read this one.', message: 'The text is too stylised or blurry for us. Try a different card, or type your artists in.', partial: data, diag };
    }
    return {
      ok: false,
      kind: 'no_artists',
      title: 'Recap spotted. Artists not found.',
      message: 'This looks like a recap, but we couldn\'t find any artists we know on it. Try the top artists card, or type them in yourself.',
      partial: data,
      diag,
    };
  }
  return { ok: true, data, diag };
}

/**
 * Two layouts exist:
 *  - paired: a title line with a credit line under it (YouTube Music, Apple Music, Spotify list)
 *  - titles-only: numbered titles with no credits (Spotify summary card); artists come from the song catalogue
 */
function extractSongs(lines: OcrLine[], matched: MatchedLine[]): { songs: WrappedData['topSongs']; mode: 'paired' | 'titles-only' | 'catalog-scan' } {
  const cleaned = lines.map((l) => ({ l, ...cleanLine(l.text) })).filter((x) => x.cleaned);
  const credits = new Map<OcrLine, ReturnType<typeof parseCredits>>();
  for (const x of cleaned) {
    const c = parseCredits(x.cleaned);
    if (c.known.length) credits.set(x.l, c);
  }

  // Pair each credit line with the closest unused line just above it in the same column, top to bottom.
  // A line only becomes a "credit" once it pairs, so a song titled like an artist ("Ghost") can still be a title.
  const pairs: { title: (typeof cleaned)[number]; credit: OcrLine }[] = [];
  const used = new Set<OcrLine>();
  const byY = [...cleaned].sort((a, b) => a.l.bbox.y0 - b.l.bbox.y0);
  for (const x of byY) {
    if (!credits.has(x.l) || used.has(x.l)) continue;
    const h = x.l.bbox.y1 - x.l.bbox.y0;
    let best: { t: (typeof cleaned)[number]; cost: number } | null = null;
    for (const t of byY) {
      if (t.l === x.l || used.has(t.l)) continue;
      const dy = x.l.bbox.y0 - t.l.bbox.y1;
      if (dy < -h * 0.3 || dy > h * 2.5) continue;
      if (!looksLikeTitle(t.cleaned, t.l.confidence)) continue;
      // Prefer real titles over lines that also look like credits.
      const cost = Math.max(dy, 0) + 3 * Math.abs(x.l.bbox.x0 - t.l.bbox.x0) + (credits.has(t.l) ? h : 0);
      if (!best || cost < best.cost) best = { t, cost };
    }
    if (best) {
      used.add(best.t.l);
      used.add(x.l);
      pairs.push({ title: best.t, credit: x.l });
    }
  }

  if (pairs.length >= 2) {
    pairs.sort((a, b) => a.title.l.bbox.y0 - b.title.l.bbox.y0);
    const songs = pairs.map(({ title, credit }) => {
      const c = credits.get(credit)!;
      const t = title.cleaned;
      matched.push({ line: `${t} / ${credit.text.trim()}`, artist: c.known.join(', '), score: 1, section: 'songs' });
      const catalog = findSong(t, c.known[0]);
      return { title: catalog?.title ?? t, artist: c.known[0], artists: c.known };
    });
    return { songs, mode: 'paired' };
  }

  // Titles-only: numbered lines, maybe "Title · Artist" on one line, else look the title up.
  const songs: WrappedData['topSongs'] = [];
  for (const x of cleaned) {
    const ranked = x.numbered && (looksLikeTitle(x.cleaned, x.l.confidence) || /^\d{2,4}$/.test(x.cleaned));
    // Un-numbered lines count only if they are a song we know (and not an artist credit line).
    if (!ranked && (credits.has(x.l) || !findSong(x.cleaned))) continue;
    const parts = x.cleaned.split(/\s+[·•|–—-]\s+/);
    let title = x.cleaned;
    let known: string[] = [];
    if (parts.length >= 2) {
      const c = parseCredits(parts[parts.length - 1]);
      if (c.known.length) {
        known = c.known;
        title = parts.slice(0, -1).join(' - ');
      }
    }
    const catalog = findSong(title, known[0]);
    if (!known.length && catalog) known = catalog.artists;
    if (known.length) matched.push({ line: x.l.text.trim(), artist: known.join(', '), score: catalog ? 0.9 : 1, section: 'songs' });
    songs.push({ title: catalog?.title ?? title, artist: known[0] ?? '', artists: known });
  }
  return { songs: preferContext(songs), mode: 'titles-only' };
}

/** Every line that is (fuzzily) a catalogue song title, top to bottom, deduped. */
function scanForSongs(lines: OcrLine[], matched: MatchedLine[]): WrappedData['topSongs'] {
  const out: WrappedData['topSongs'] = [];
  const seen = new Set<string>();
  for (const l of lines) {
    const { cleaned } = cleanLine(l.text);
    if (!cleaned || l.confidence < 50 || (cleaned.match(/\p{L}/gu)?.length ?? 0) < 3) continue;
    // Try the whole line, then "Title - Artist" style halves.
    const candidates = [cleaned, ...cleaned.split(/\s+[·•|–—-]\s+/)];
    const song = candidates.map((c) => findSong(c)).find(Boolean);
    if (!song || seen.has(song.title + song.artists[0])) continue;
    seen.add(song.title + song.artists[0]);
    matched.push({ line: l.text.trim(), artist: song.artists.join(', '), score: 0.85, section: 'songs' });
    out.push({ title: song.title, artist: song.artists[0], artists: song.artists });
    if (out.length >= 10) break;
  }
  return preferContext(out);
}

/**
 * Shared titles ("Die For You": The Weeknd and Joji) resolve to whichever version's artist
 * the rest of the list points to.
 */
function preferContext(songs: WrappedData['topSongs']): WrappedData['topSongs'] {
  const tally = new Map<string, number>();
  songs.forEach((s) => s.artists?.forEach((a) => tally.set(a, (tally.get(a) ?? 0) + 1)));
  return songs.map((s) => {
    const versions = songsByTitle(s.title);
    if (versions.length < 2) return s;
    const score = (artists: string[]) => artists.reduce((n, a) => n + (tally.get(a) ?? 0) - (s.artists?.includes(a) ? 1 : 0), 0);
    const best = [...versions].sort((a, b) => score(b.artists) - score(a.artists))[0];
    return score(best.artists) > score(s.artists ?? []) ? { title: best.title, artist: best.artists[0], artists: best.artists } : s;
  });
}
