import type { Condition, ConditionId } from '../types';

export const CONDITIONS: Condition[] = [
  {
    id: 'depression',
    tagline: 'Professional sad-song sommelier.',
    name: 'Major Depressive Disorder',
    short: 'Depression',
    emoji: '🌧️',
    color: '#5b8def',
    clinical:
      'A mood disorder marked by persistent low mood or loss of interest in almost everything, lasting at least two weeks and getting in the way of daily life.',
    symptoms: ['Persistent sadness or emptiness', 'Loss of interest or pleasure', 'Sleep and appetite changes', 'Fatigue, low energy', 'Feelings of worthlessness'],
    musicTell: 'Your top five is basically a breakup montage on loop.',
    treatments: ['CBT', 'Interpersonal Therapy', 'Behavioral Activation'],
  },
  {
    id: 'bipolar',
    tagline: 'Crying in the club. Literally.',
    name: 'Bipolar Disorder',
    short: 'Bipolar',
    emoji: '🎢',
    color: '#c084fc',
    clinical:
      'A condition involving episodes of depression alternating with episodes of mania or hypomania: unusually elevated mood, energy and activity.',
    symptoms: ['Depressive episodes', 'Manic or hypomanic episodes', 'Reduced need for sleep during highs', 'Racing thoughts', 'Impulsivity during highs'],
    musicTell: 'Your queue goes from sobbing in the shower to doing donuts in a parking lot, with no transition.',
    treatments: ['Psychoeducation', 'IPSRT', 'CBT'],
  },
  {
    id: 'anxiety',
    tagline: 'Overthinking, now with a soundtrack.',
    name: 'Generalized Anxiety Disorder',
    short: 'Anxiety',
    emoji: '🌀',
    color: '#f59e0b',
    clinical:
      'Excessive, hard-to-control worry about many everyday things, present on most days for six months or more, often with physical tension.',
    symptoms: ['Constant worry', 'Restlessness, feeling on edge', 'Muscle tension', 'Trouble concentrating', 'Sleep disturbance'],
    musicTell: 'You use loud guitars so you can\'t hear your own thoughts.',
    treatments: ['CBT', 'ACT', 'Mindfulness-Based Therapy'],
  },
  {
    id: 'social_anxiety',
    tagline: 'Headphones in. World out.',
    name: 'Social Anxiety Disorder',
    short: 'Social Anxiety',
    emoji: '🎧',
    color: '#14b8a6',
    clinical:
      'An intense, persistent fear of being watched or judged in social situations, leading to avoidance that affects work, school or relationships.',
    symptoms: ['Fear of judgement', 'Avoiding social events', 'Blushing, sweating, shaking', 'Overanalysing interactions afterwards'],
    musicTell: 'Headphones in, indie on, eye contact off.',
    treatments: ['CBT', 'Exposure Therapy', 'Group Therapy'],
  },
  {
    id: 'ocd',
    tagline: 'Same playlist. Same order. Every time.',
    name: 'Obsessive-Compulsive Disorder',
    short: 'OCD',
    emoji: '🔁',
    color: '#22c55e',
    clinical:
      'Recurring, unwanted thoughts (obsessions) and repetitive behaviours or mental acts (compulsions) done to relieve the distress they cause.',
    symptoms: ['Intrusive, unwanted thoughts', 'Repetitive checking or ordering', 'Need for things to feel "just right"', 'Significant time lost to rituals'],
    musicTell: 'Precisely structured music, played exactly the same number of times, in the same order.',
    treatments: ['ERP', 'CBT', 'ACT'],
  },
  {
    id: 'adhd',
    tagline: 'Skipped this sentence at 0:31.',
    name: 'Attention-Deficit/Hyperactivity Disorder',
    short: 'ADHD',
    emoji: '⚡',
    color: '#ef4444',
    clinical:
      'A neurodevelopmental condition with ongoing patterns of inattention and/or hyperactivity-impulsivity that interfere with functioning.',
    symptoms: ['Difficulty sustaining attention', 'Restlessness', 'Impulsivity', 'Disorganisation', 'Hyperfocus on interesting things'],
    musicTell: 'Nothing under 128 BPM, and you skip at 0:31 anyway.',
    treatments: ['CBT for ADHD', 'ADHD Coaching', 'Psychoeducation'],
  },
  {
    id: 'bpd',
    tagline: 'Every bridge is about one person.',
    name: 'Borderline Personality Disorder',
    short: 'BPD',
    emoji: '💔',
    color: '#ec4899',
    clinical:
      'A pattern of unstable emotions, self-image and relationships, often with intense fear of abandonment and difficulty regulating feelings.',
    symptoms: ['Intense, rapidly shifting emotions', 'Fear of abandonment', 'Unstable relationships', 'Impulsive behaviour', 'Chronic emptiness'],
    musicTell: 'Every bridge is about a specific person, and you know exactly who.',
    treatments: ['DBT', 'Schema Therapy', 'Mentalization-Based Therapy'],
  },
  {
    id: 'schizophrenia',
    tagline: 'The reverb is talking to me.',
    name: 'Schizophrenia-Spectrum',
    short: 'Schizophrenia-spectrum',
    emoji: '🌌',
    color: '#8b5cf6',
    clinical:
      'A group of conditions that affect how a person perceives reality, which may include hallucinations, delusions and disorganised thinking. Highly treatable with early, coordinated care.',
    symptoms: ['Hallucinations', 'Delusions', 'Disorganised thinking or speech', 'Reduced motivation or expression'],
    musicTell: 'Twelve-minute songs with backwards vocals. You swear the reverb is trying to tell you something.',
    treatments: ['CBT for Psychosis', 'Family Therapy', 'Coordinated Specialty Care'],
  },
  {
    id: 'insomnia',
    tagline: 'Peak listening hour: 3:12 AM.',
    name: 'Insomnia Disorder',
    short: 'Insomnia',
    emoji: '🌙',
    color: '#6366f1',
    clinical:
      'Ongoing difficulty falling asleep, staying asleep or waking too early, at least three nights a week for three months, with daytime impact.',
    symptoms: ['Trouble falling or staying asleep', 'Waking too early', 'Daytime tiredness', 'Irritability, poor focus'],
    musicTell: 'Your peak listening hour is 3:12 AM.',
    treatments: ['CBT-I', 'Sleep Hygiene Coaching', 'Mindfulness-Based Therapy'],
  },
  {
    id: 'seasonal',
    tagline: 'Romanticising rain, all year round.',
    name: 'Seasonal Affective Disorder',
    short: 'Seasonal Depression',
    emoji: '🍂',
    color: '#f97316',
    clinical:
      'A form of depression that follows a seasonal pattern, most often starting in autumn or winter and easing in spring.',
    symptoms: ['Low mood in certain seasons', 'Oversleeping', 'Carb cravings', 'Withdrawal, low energy'],
    musicTell: 'You romanticise rain, cardigans and the year 1974.',
    treatments: ['CBT', 'Light Therapy Guidance', 'Behavioral Activation'],
  },
  {
    id: 'mania',
    tagline: 'Unstoppable. Allegedly.',
    name: 'Hypomanic Episode',
    short: 'Hypomania',
    emoji: '🚀',
    color: '#eab308',
    clinical:
      'A distinct period of unusually elevated, expansive or irritable mood with increased energy, lasting at least four days. Milder than full mania, and often part of bipolar disorder.',
    symptoms: ['Inflated self-esteem or grandiosity', 'Decreased need for sleep', 'Racing thoughts, talking fast', 'Impulsive spending or risk-taking', 'Unusually high energy'],
    musicTell: 'Every song is about being rich, unstoppable and on top of the world, and lately you\'ve started believing it\'s about you.',
    treatments: ['Psychoeducation', 'Mood Monitoring', 'CBT'],
  },
];

export const CONDITION_IDS = CONDITIONS.map((c) => c.id);

export const CONDITION_BY_ID = Object.fromEntries(CONDITIONS.map((c) => [c.id, c])) as Record<
  ConditionId,
  Condition
>;

export const emptyScores = () =>
  Object.fromEntries(CONDITION_IDS.map((id) => [id, 0])) as Record<ConditionId, number>;
