import { useEffect, useMemo, useState } from 'react';
import type { Diagnosis, WrappedData } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';
import { findArtist } from '../data/artists';
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

function isLightColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export default function Result({ diagnosis: d, data, city, onRestart, onEdit }: Props) {
  const cond = CONDITION_BY_ID[d.primary];
  const [revealed, setRevealed] = useState(reduceMotion());
  const [line, setLine] = useState(0);
  const [sharing, setSharing] = useState(false);
  const therapists = useMemo(() => recommendTherapists(d.primary, d.secondary, city || undefined), [d, city]);
  const artists = useMemo(() => data.topArtists.filter((a) => findArtist(a)).slice(0, 2), [data]);
  const score = useCountUp(Math.round(d.confidence * 100), revealed);

  const topText = isLightColor(cond.color) ? '#141414' : '#ffffff';
  const topMuted = isLightColor(cond.color) ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';

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
          {/* ── TOP: colour block ── */}
          <div className="rx-top" style={{ background: cond.color, color: topText } as React.CSSProperties}>
            {/* Ghost initial */}
            <span className="rx-ghost" aria-hidden="true">{cond.short[0]}</span>

            {/* Brand row */}
            <div className="rx-brand">
              <span className="rx-wm">wrapped<em>therapy</em></span>
              <span className="rx-yr">{data.year}</span>
            </div>
            <span className="rx-handle" style={{ color: topMuted }}>@dietcokecode</span>

            {/* Diagnosis */}
            <div className="rx-dx">
              <span className="rx-label">Dr. Playlist diagnoses you with</span>
              <h1 className="rx-condition">{cond.short}</h1>
              <p className="rx-tagline">"{cond.tagline}"</p>
            </div>

            {artists.length > 0 && (
              <p className="rx-artist" style={{ color: topMuted }}>thanks to {artists.join(' & ')}</p>
            )}
          </div>

          {/* ── BOTTOM: white section ── */}
          <div className="rx-bottom">
            <div className="rx-conf">
              <span className="rx-pct">{score}%</span>
              <div className="rx-vsep" />
              <div>
                <span className="rx-match-label">confidence match</span>
                <span className="rx-sev">{d.severity}</span>
              </div>
            </div>

            {d.secondary.length > 0 && (
              <p className="dx-side">with a side of {d.secondary.map((s) => CONDITION_BY_ID[s].short.toLowerCase()).join(' & ')}</p>
            )}

            <p className="dx-headline">"{d.headline}"</p>
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
