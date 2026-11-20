import { useEffect, useState } from 'react';
import type { ParseProgress } from '../lib/parser';
import { Vinyl } from './Doodles';

const QUIPS = [
  'Counting your Arijit tears…',
  'Measuring bass levels in your bloodstream…',
  'Asking your ex for a comment…',
  'Checking how many times you replayed that one song…',
  'Consulting Dr. Playlist…',
  'Skipping the intro, like you do…',
  'Reading between the lyrics…',
];

const STAGE_LABEL: Record<ParseProgress['stage'], string> = {
  checking: 'checking the screenshot',
  loading: 'warming up the reader',
  reading: 'reading your recap',
  'second-look': 'taking a closer look',
  matching: 'matching artists',
};

const overall = (p: ParseProgress) => {
  const pct = (p.pct ?? 0) / 100;
  switch (p.stage) {
    case 'checking': return 5;
    case 'loading': return 12;
    case 'reading': return 15 + pct * 65;
    case 'second-look': return 80 + pct * 15;
    case 'matching': return 98;
  }
};

export default function Scanning({ preview, progress }: { preview?: string; progress: ParseProgress }) {
  const [q, setQ] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setQ((x) => (x + 1) % QUIPS.length), 1400);
    return () => clearInterval(t);
  }, []);
  const pct = Math.round(overall(progress));

  return (
    <section className="wrap scanning">
      <div className="scan-stage">
        <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="56" />
          <circle className="ring-fill" cx="60" cy="60" r="56" style={{ strokeDashoffset: 352 - (352 * pct) / 100 }} />
        </svg>
        <Vinyl speed="fast" label={preview ? <img src={preview} alt="" /> : undefined} />
      </div>
      <h2 key={q} className="quip">{QUIPS[q]}</h2>
      <p className="scan-meta">
        {STAGE_LABEL[progress.stage]} · <b>{pct}%</b>
      </p>
      <p className="fine">All of this happens on your device. Nothing is uploaded.</p>
    </section>
  );
}
