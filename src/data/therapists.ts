import type { ConditionId, Therapist } from '../types';
import { CONDITIONS, CONDITION_IDS } from './conditions';

/**
 * FICTIONAL seed therapists, generated deterministically.
 * Swap this module for a real (opt-in / partnered) directory later.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2026);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);

const FIRST = ['Aanya', 'Rohan', 'Meera', 'Kabir', 'Ishita', 'Arjun', 'Naina', 'Vikram', 'Tara', 'Dev', 'Zoya', 'Kunal', 'Riya', 'Aditya', 'Sana', 'Neel', 'Priya', 'Farhan', 'Diya', 'Siddharth', 'Leela', 'Harsh', 'Anika', 'Yusuf', 'Kavya', 'Rahul', 'Mira', 'Aarav', 'Nisha', 'Imran', 'Sarah', 'Daniel', 'Maya', 'Oliver', 'Elena', 'Samuel'];
const LAST = ['Mehta', 'Kapoor', 'Iyer', 'Sharma', 'Banerjee', 'Reddy', 'Kohli', 'Nair', 'Desai', 'Malhotra', 'Qureshi', 'Fernandes', 'Ghosh', 'Pillai', 'Chatterjee', 'Bhatt', 'Sethi', 'Rao', 'Khanna', 'Mukherjee', 'Gill', 'Joshi', 'D\'Souza', 'Verma'];
const CITIES: { city: string; langs: string[] }[] = [
  { city: 'Mumbai', langs: ['Marathi'] },
  { city: 'Delhi', langs: ['Punjabi'] },
  { city: 'Bengaluru', langs: ['Kannada'] },
  { city: 'Pune', langs: ['Marathi'] },
  { city: 'Hyderabad', langs: ['Telugu'] },
  { city: 'Chennai', langs: ['Tamil'] },
  { city: 'Kolkata', langs: ['Bengali'] },
  { city: 'Gurugram', langs: ['Punjabi'] },
  { city: 'Noida', langs: [] },
  { city: 'Ahmedabad', langs: ['Gujarati'] },
  { city: 'Chandigarh', langs: ['Punjabi'] },
  { city: 'Kochi', langs: ['Malayalam'] },
];
const TITLES = ['Clinical Psychologist', 'Counselling Psychologist', 'Psychiatrist', 'Licensed Psychotherapist', 'Clinical Psychologist (RCI)'];

const BIO: Record<ConditionId, string[]> = {
  depression: ['Helps people find colour again after long grey seasons.', 'Gentle, structured work on low mood and motivation.'],
  bipolar: ['Works on mood tracking, routines and staying steady across highs and lows.', 'Specialises in long-term mood stability planning.'],
  anxiety: ['Practical tools for a mind that won\'t stop running scenarios.', 'Calm, evidence-based support for chronic worry.'],
  social_anxiety: ['Helps you walk into the room without rehearsing it twelve times first.', 'Gradual, kind exposure work for social fear.'],
  ocd: ['ERP-focused work for intrusive thoughts and rituals.', 'Helps you break loops, one repetition at a time.'],
  adhd: ['Systems and self-compassion for brains with too many tabs open.', 'Adult ADHD assessment support and coaching.'],
  bpd: ['DBT-trained; focuses on emotional regulation and relationships.', 'Steady, validating space for big feelings.'],
  schizophrenia: ['Experience in early-intervention and family-inclusive care.', 'Recovery-oriented support alongside psychiatric care.'],
  insomnia: ['CBT-I practitioner: fix the sleep, fix a lot of other things.', 'Helps night owls negotiate with their bedtime.'],
  seasonal: ['Works on seasonal mood dips, routines and light exposure.', 'Behavioural activation for the cardigan months.'],
  mania: ['Helps you notice the highs early and keep sleep, spending and plans steady.', 'Mood-monitoring and routine work for high-energy episodes.'],
};

const COUNT = 66; // 6 per condition

export const THERAPISTS: Therapist[] = Array.from({ length: COUNT }, (_, i) => {
  const primary = CONDITION_IDS[i % CONDITION_IDS.length];
  const extras = new Set<ConditionId>();
  const extraCount = 1 + Math.floor(rand() * 2);
  while (extras.size < extraCount) {
    const c = pick(CONDITION_IDS);
    if (c !== primary) extras.add(c);
  }
  const specialties = [primary, ...extras];
  const modalities = Array.from(
    new Set(specialties.flatMap((s) => CONDITIONS.find((c) => c.id === s)!.treatments.slice(0, 2))),
  ).slice(0, 4);
  const loc = pick(CITIES);
  const title = pick(TITLES);
  const doctor = title.startsWith('Clinical') || title === 'Psychiatrist';
  const name = `${doctor ? 'Dr. ' : ''}${pick(FIRST)} ${pick(LAST)}`;
  const mode = pick(['Online', 'In-person', 'Hybrid'] as const);

  return {
    id: `t${i + 1}`,
    name,
    title,
    specialties,
    modalities,
    city: loc.city,
    mode,
    languages: ['English', 'Hindi', ...loc.langs],
    feeInr: Math.round(between(8, 40)) * 100,
    experienceYears: Math.round(between(3, 24)),
    rating: Math.round(between(4.2, 5) * 10) / 10,
    reviews: Math.round(between(12, 480)),
    bio: pick(BIO[primary]),
    hue: Math.round(rand() * 360),
  };
});

export const CITY_OPTIONS = CITIES.map((c) => c.city);

export function recommendTherapists(
  primary: ConditionId,
  secondary: ConditionId[],
  city?: string,
  limit = 3,
): Therapist[] {
  const score = (t: Therapist) => {
    let s = 0;
    if (t.specialties[0] === primary) s += 10;
    else if (t.specialties.includes(primary)) s += 6;
    s += secondary.filter((c) => t.specialties.includes(c)).length * 2;
    if (city && t.city === city) s += 5;
    if (city && t.mode !== 'In-person') s += 1;
    return s + t.rating;
  };
  return THERAPISTS.filter((t) => t.specialties.includes(primary))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}
