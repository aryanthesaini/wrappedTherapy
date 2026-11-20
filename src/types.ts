export type ConditionId =
  | 'depression'
  | 'bipolar'
  | 'anxiety'
  | 'social_anxiety'
  | 'ocd'
  | 'adhd'
  | 'bpd'
  | 'schizophrenia'
  | 'insomnia'
  | 'seasonal'
  | 'mania';

export type Scores = Record<ConditionId, number>;

export interface Condition {
  id: ConditionId;
  name: string;
  short: string;
  emoji: string;
  color: string;
  /** Real, plain-language description of the condition. */
  clinical: string;
  symptoms: string[];
  /** The joke: why your music "implies" this. */
  musicTell: string;
  /** Therapy approaches typically used — drives therapist matching. */
  treatments: string[];
}

export interface Genre {
  id: string;
  label: string;
  /** -2 (devastating) … +2 (euphoric) */
  valence: number;
  /** 0 (still) … 2 (bouncing off walls) */
  energy: number;
  weights: Partial<Scores>;
}

export type Region = 'IN' | 'PK' | 'GLOBAL' | 'KR' | 'LATAM' | 'AF';

export interface Artist {
  name: string;
  region: Region;
  genres: string[];
  aliases?: string[];
}

export interface Therapist {
  id: string;
  name: string;
  title: string;
  specialties: ConditionId[];
  modalities: string[];
  city: string;
  mode: 'Online' | 'In-person' | 'Hybrid';
  languages: string[];
  feeInr: number;
  experienceYears: number;
  rating: number;
  reviews: number;
  bio: string;
  hue: number;
}

export type Platform = 'spotify' | 'youtube' | 'apple' | 'amazon';

export interface WrappedData {
  platform: Platform;
  year: number;
  topArtists: string[];
  /** artist = primary credit ('' if unknown); artists = all recognised credits, primary first. */
  topSongs: { title: string; artist: string; artists?: string[] }[];
  topGenre?: string;
  minutesListened?: number;
}

export interface Evidence {
  artist: string;
  genreLabel: string;
  points: number;
}

export interface Diagnosis {
  scores: Scores;
  percentages: Scores;
  ranked: ConditionId[];
  primary: ConditionId;
  secondary: ConditionId[];
  severity: string;
  confidence: number;
  headline: string;
  evidence: Evidence[];
  moodSwing?: { sadArtist: string; hypeArtist: string; sadShare: number; hypeShare: number };
  recognized: string[];
  unrecognized: string[];
}
