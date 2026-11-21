import { useEffect, useMemo, useState } from 'react';
import type { Diagnosis, WrappedData } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';
import { recommendTherapists } from '../data/therapists';
import TherapistCard from './TherapistCard';
import Burst from './Burst';
import ShareSheet from './ShareSheet';
import { Ekg, Mascot } from './Doodles';

interface Props {
  diagnosis: Diagnosis;
  data: WrappedData;
  city: string;
  onRestart: () => void;
  onEdit: () => void;
}

const REVEAL_LINES = ['Dr. Playlist is reviewing your case…', 'Cross-checking with your 3 AM listening…', 'Writing your prescription…'];

function useCountUp(target: number, start: boolean, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, ms]);
  return v;
}

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Result({ diagnosis: d, data, city, onRestart, onEdit }: Props) {
  const cond = CONDITION_BY_ID[d.primary];
  const [revealed, setRevealed] = useState(reduceMotion());
  const [line, setLine] = useState(0);
  const [sharing, setSharing] = useState(false);
  const therapists = useMemo(() => recommendTherapists(d.primary, d.secondary, city || undefined), [d, city]);
  const score = useCountUp(Math.round(d.confidence * 100), revealed);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (revealed) return;
    const a = setInterval(() => setLine((x) => Math.min(x + 1, REVEAL_LINES.length - 1)), 900);
    const b = setTimeout(() => setRevealed(true), 2700);
    return () => { clearInterval(a); clearTimeout(b); };
  }, [revealed]);

  if (!revealed) {
    return (
      <section className="wrap reveal">
        <Ekg />
        <h2 key={line} className="quip">{REVEAL_LINES[line]}</h2>
        <button className="text-link" onClick={() => setRevealed(true)}>skip</button>
      </section>
    );
  }

  return (
    <div className="result" style={{ ['--accent' as string]: cond.color }}>
      {sharing && <ShareSheet diagnosis={d} data={data} therapists={therapists} onClose={() => setSharing(false)} />}
      {/* 1 · the diagnosis */}
      <section className="wrap rx-wrap">
        <Burst emojis={[cond.emoji, '♪', '💊', cond.emoji, '♫']} />
        <article className="rx">
          <header className="rx-head">
            <div>
              <b>Dr. Playlist</b>
              <span>Dept. of Questionable Listening</span>
            </div>
            <span className="rx-date">{today}</span>
          </header>
          <div className="rx-body">
            <div className="rx-main">
              <span className="kicker">℞ your {data.year} diagnosis</span>
              <h1 className="dx-name">
                <span className="dx-emoji">{cond.emoji}</span>
                <em className="serif-hl">{cond.short}</em>
              </h1>
              <p className="dx-formal">{cond.name}</p>
              <p className="dx-headline">“{d.headline}”</p>
              {d.secondary.length > 0 && (
                <p className="dx-side">with a side of {d.secondary.map((s) => CONDITION_BY_ID[s].short.toLowerCase()).join(' & ')}</p>
              )}
            </div>
            <aside className="rx-side">
              <div className="gauge" style={{ ['--p' as string]: score }}>
                <div className="gauge-inner">
                  <b>{score}%</b>
                  <span>{d.severity.toLowerCase()}</span>
                </div>
              </div>
              <span className="rx-stamp">diagnosed</span>
            </aside>
          </div>
        </article>
        <div className="hero-cta center">
          <button className="cta" onClick={() => setSharing(true)}>Share my diagnosis <span className="cta-arrow">↗</span></button>
          <button className="text-link" onClick={onEdit}>edit artists</button>
          <button className="text-link" onClick={onRestart}>new recap</button>
        </div>
      </section>

      {/* 2 · who to talk to */}
      <section className="wrap section therapists">
        <div className="section-head">
          <div>
            <span className="kicker">your care team</span>
            <h2 className="h2">Therapists who <em className="serif">get it.</em></h2>
          </div>
          <p className="lede small">
            Picked for {cond.short.toLowerCase()}{city ? ` near ${city}` : ''}. They usually work with {cond.treatments.slice(0, 2).join(' and ')}.
          </p>
        </div>
        <div className="t-grid">
          {therapists.map((t, i) => <TherapistCard key={t.id} t={t} highlight={d.primary} index={i} />)}
        </div>
      </section>

      {/* 3 · the honest bit */}
      <section className="wrap section real-talk-wrap">
        <details className="card real-talk">
          <summary>
            <h3>Wait, is this real?</h3>
            <Mascot className="mascot-mini" mood="think" />
          </summary>
          <p>
            No. Music taste can't diagnose anything. But {cond.short.toLowerCase()} is real: {cond.clinical.charAt(0).toLowerCase() + cond.clinical.slice(1)}
          </p>
          <p className="fine">If this actually sounds like you, talking to someone helps. That's what the people above are for.</p>
        </details>
      </section>
    </div>
  );
}
