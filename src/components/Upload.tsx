import { useRef, useState } from 'react';
import type { Platform } from '../types';
import { Equalizer, FloatingNotes, Mascot, Squiggle, Vinyl } from './Doodles';

const PLATFORMS: { id: Platform; label: string; dot: string }[] = [
  { id: 'spotify', label: 'Spotify Wrapped', dot: '#1ed760' },
  { id: 'youtube', label: 'YouTube Music Recap', dot: '#ff3b3b' },
  { id: 'apple', label: 'Apple Music Replay', dot: '#fa5c7c' },
  { id: 'amazon', label: 'Amazon Music', dot: '#25d1da' },
];

const MARQUEE = [
  'arijit singh → depression 🌧️',
  'karan aujla → hypomania 🚀',
  'arijit + aujla → bipolar 🎢',
  'the weeknd → insomnia 🌙',
  'pink floyd → the reverb is talking 🌌',
  'anirudh → adhd ⚡',
  'taylor swift → a bridge about one person 💔',
  'prateek kuhad → social anxiety 🎧',
  'jagjit singh → 3 am ghazals 🥃',
  'seedhe maut → hypomania 🚀',
];

interface Props {
  platform: Platform;
  onPlatform: (p: Platform) => void;
  onFile: (file: File) => void;
  onManual: () => void;
}

export default function Upload({ platform, onPlatform, onFile, onManual }: Props) {
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(f);
    if (input.current) input.current.value = '';
  };

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="kicker"><Equalizer bars={4} className="eq-mini" /> recap season is open</span>
            <h1>
              Your playlist isn't <span className="strike">a vibe<Squiggle /></span> it's a <em className="serif-hl">symptom.</em>
            </h1>
            <p className="lede">
              Drop your year-end music recap. We read your top artists, do some deeply unscientific maths, and find you a
              therapist who gets your kind of playlist.
            </p>
            <div className="hero-cta">
              <button className="cta" onClick={() => input.current?.click()}>
                Upload my recap <span className="cta-arrow">→</span>
              </button>
              <button className="text-link" onClick={onManual}>or type my artists</button>
            </div>
          </div>
          <div className="hero-art">
            <div className="blob" />
            <Vinyl />
            <Mascot className="mascot-hero" />
            <FloatingNotes />
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      <section className="wrap section upload-zone">
        <h2 className="h2">Pick your app. <em className="serif">Drop the screenshot.</em></h2>

        <div className="pills">
          {PLATFORMS.map((p) => (
            <button key={p.id} className={`pill ${platform === p.id ? 'on' : ''}`} onClick={() => onPlatform(p.id)}>
              <span className="dot" style={{ background: p.dot }} /> {p.label}
            </button>
          ))}
        </div>

        <div
          className={`dropzone ${drag ? 'drag' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        >
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handle(e.target.files)} />
          <div className="drop-icon"><span>↑</span></div>
          <p className="drop-title">{drag ? 'Let go, we got it' : 'Drop your top artists or top songs card'}</p>
          <p className="drop-hint">or click to pick a screenshot · it never leaves your phone</p>
        </div>
      </section>
    </>
  );
}
