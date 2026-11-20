import type { Artist, ConditionId, Diagnosis, Evidence, Scores, WrappedData } from '../types';
import { CONDITION_BY_ID, CONDITION_IDS, emptyScores } from '../data/conditions';
import { GENRE_BY_ID, genreFromText } from '../data/genres';
import { findArtist } from '../data/artists';
import { findSong } from '../data/songs';

/** Tunables — tweak these to change how the "diagnosis" behaves. */
export const TUNING = {
  /** Weight of artist at rank i = 1 / (1 + RANK_DECAY * i). */
  RANK_DECAY: 0.3,
  /** Songs count as partial votes for their artists (featured artists get half). */
  SONG_WEIGHT: 0.6,
  FEATURED_SHARE: 0.5,
  /** Wrapped "top genre" counts as this many #1 artists. */
  TOP_GENRE_WEIGHT: 1,
  /** Both sad share and hype share must exceed this to trigger mood-swing. */
  MOOD_SWING_MIN_SHARE: 0.15,
  /** Bipolar bonus = total * min(sad, hype) * this. */
  MOOD_SWING_MULTIPLIER: 2.2,
  /** Minutes listened above this adds insomnia points. */
  HEAVY_LISTENER_MINUTES: 60000,
};

/** Condition profile of a set of genres: the average of their weights. */
export function genreProfile(genres: string[]): Scores {
  const s = emptyScores();
  const gs = genres.map((id) => GENRE_BY_ID[id]).filter(Boolean);
  for (const g of gs) for (const [c, w] of Object.entries(g.weights)) s[c as ConditionId] += (w ?? 0) / gs.length;
  return s;
}

export const artistProfile = (artist: Artist) => genreProfile(artist.genres);

const mood = (genres: string[]) => {
  const gs = genres.map((id) => GENRE_BY_ID[id]).filter(Boolean);
  const valence = gs.reduce((a, g) => a + g.valence, 0) / (gs.length || 1);
  const energy = gs.reduce((a, g) => a + g.energy, 0) / (gs.length || 1);
  return { sad: valence <= -1, hype: valence + energy >= 3 };
};

const SEVERITY = [
  { min: 0.55, label: 'Very strong' },
  { min: 0.4, label: 'Strong' },
  { min: 0.25, label: 'Moderate' },
  { min: 0, label: 'Mild' },
];

export function diagnose(data: WrappedData): Diagnosis {
  const scores = emptyScores();
  type Entry = { artist: Artist; weight: number; sadW: number; hypeW: number; scores: Scores };
  const contributions = new Map<string, Entry>();
  const recognized: string[] = [];
  const unrecognized: string[] = [];

  /** Credit `weight` to an artist, scored with `genres` (a song's own mood, or the artist's usual genres). */
  const addArtist = (artist: Artist, weight: number, genres: string[] = artist.genres) => {
    const prof = genreProfile(genres);
    const m = mood(genres);
    const entry = contributions.get(artist.name) ?? { artist, weight: 0, sadW: 0, hypeW: 0, scores: emptyScores() };
    entry.weight += weight;
    if (m.sad) entry.sadW += weight;
    if (m.hype) entry.hypeW += weight;
    for (const c of CONDITION_IDS) {
      scores[c] += prof[c] * weight;
      entry.scores[c] += prof[c] * weight;
    }
    contributions.set(artist.name, entry);
  };

  data.topArtists.forEach((name, i) => {
    const artist = findArtist(name);
    const weight = 1 / (1 + TUNING.RANK_DECAY * i);
    if (artist) {
      recognized.push(artist.name);
      addArtist(artist, weight);
    } else {
      unrecognized.push(name);
    }
  });

  data.topSongs.forEach((song, i) => {
    const credited = song.artists?.length ? song.artists : song.artist ? [song.artist] : [];
    const catalog = findSong(song.title, credited[0]);
    const names = credited.length ? credited : catalog?.artists ?? [];
    const base = TUNING.SONG_WEIGHT / (1 + TUNING.RANK_DECAY * i);
    names.forEach((name, k) => {
      const artist = findArtist(name);
      if (!artist) return;
      const genres = catalog?.genre && catalog.artists.includes(artist.name) ? [catalog.genre] : artist.genres;
      addArtist(artist, k === 0 ? base : base * TUNING.FEATURED_SHARE, genres);
    });
  });

  const topGenreId = genreFromText(data.topGenre);
  if (topGenreId) {
    const g = GENRE_BY_ID[topGenreId];
    for (const [c, w] of Object.entries(g.weights)) scores[c as ConditionId] += (w ?? 0) * TUNING.TOP_GENRE_WEIGHT;
  }

  if ((data.minutesListened ?? 0) > TUNING.HEAVY_LISTENER_MINUTES) {
    scores.insomnia += 2 + ((data.minutesListened! - TUNING.HEAVY_LISTENER_MINUTES) / 10000) * 0.5;
  }

  // ── Mood-swing rule: heavy sad AND heavy hype listening ⇒ bipolar ──
  let moodSwing: Diagnosis['moodSwing'];
  const entries = [...contributions.values()];
  const totalWeight = entries.reduce((a, e) => a + e.weight, 0) || 1;
  const sadEntries = entries.filter((e) => e.sadW > 0);
  const hypeEntries = entries.filter((e) => e.hypeW > 0);
  const sadShare = sadEntries.reduce((a, e) => a + e.sadW, 0) / totalWeight;
  const hypeShare = hypeEntries.reduce((a, e) => a + e.hypeW, 0) / totalWeight;
  if (sadShare >= TUNING.MOOD_SWING_MIN_SHARE && hypeShare >= TUNING.MOOD_SWING_MIN_SHARE) {
    const total = CONDITION_IDS.reduce((a, c) => a + scores[c], 0);
    const bonus = total * Math.min(sadShare, hypeShare) * TUNING.MOOD_SWING_MULTIPLIER;
    scores.bipolar += bonus;
    // Attribute the bonus back to the artists: half to the sad side, half to the hype side, by weight.
    for (const [side, key] of [[sadEntries, 'sadW'], [hypeEntries, 'hypeW']] as const) {
      const sideWeight = side.reduce((a, e) => a + e[key], 0);
      side.forEach((e) => (e.scores.bipolar += (bonus / 2) * (e[key] / sideWeight)));
    }
    const top = (es: Entry[], key: 'sadW' | 'hypeW') => [...es].sort((a, b) => b[key] - a[key])[0].artist.name;
    moodSwing = { sadArtist: top(sadEntries, 'sadW'), hypeArtist: top(hypeEntries, 'hypeW'), sadShare, hypeShare };
  }

  const total = CONDITION_IDS.reduce((a, c) => a + scores[c], 0) || 1;
  const percentages = Object.fromEntries(CONDITION_IDS.map((c) => [c, scores[c] / total])) as Scores;
  const ranked = [...CONDITION_IDS].sort((a, b) => scores[b] - scores[a]);
  const primary = ranked[0];
  const secondary = ranked.slice(1, 3).filter((c) => percentages[c] >= 0.08);
  const confidence = percentages[primary];
  const severity = SEVERITY.find((s) => confidence >= s.min)!.label;

  const evidence: Evidence[] = entries
    .map((e) => ({
      artist: e.artist.name,
      genreLabel: e.artist.genres.map((g) => GENRE_BY_ID[g]?.label).join(' · '),
      points: Math.round(e.scores[primary] * 10) / 10,
    }))
    .filter((e) => e.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 4);

  return {
    scores,
    percentages,
    ranked,
    primary,
    secondary,
    severity,
    confidence,
    headline: buildHeadline(primary, evidence, moodSwing),
    evidence,
    moodSwing,
    recognized,
    unrecognized,
  };
}

function buildHeadline(primary: ConditionId, evidence: Evidence[], mood: Diagnosis['moodSwing']): string {
  const cond = CONDITION_BY_ID[primary];
  if (primary === 'bipolar' && mood) {
    return `You switch between ${mood.sadArtist} (${Math.round(mood.sadShare * 100)}% of your year in tears) and ${mood.hypeArtist} (${Math.round(mood.hypeShare * 100)}% acting invincible). That's not a playlist, that's a mood chart.`;
  }
  const [a, b] = evidence;
  if (!a) return cond.musicTell;
  const names = b ? `${a.artist} and ${b.artist}` : a.artist;
  return `Because you keep coming back to ${names}, we're seeing strong signs of ${cond.short.toLowerCase()}. ${cond.musicTell}`;
}
