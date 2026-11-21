import { useRef, useState } from 'react';
import { Equalizer, FloatingNotes, Mascot, Squiggle, Vinyl } from './Doodles';

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
  onFile: (file: File) => void;
  onManual: () => void;
}

export default function Upload({ onFile, onManual }: Props) {
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pick = () => input.current?.click();

  const handle = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(f);
    if (input.current) input.current.value = '';
  };

  return (
    <>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handle(e.target.files)} />

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="kicker"><Equalizer bars={4} className="eq-mini" /> recap season is open</span>
            <h1>
              <span className="line">Your playlist</span>
              <span className="line">isn't <span className="strike">a vibe<Squiggle /></span></span>
              <span className="line">it's a <em className="serif-hl">symptom.</em></span>
            </h1>
            <p className="lede">
              Drop your year-end music recap. We read your top artists, do some deeply unscientific maths, and find you a
              therapist who gets your kind of playlist.
            </p>
            <div className="hero-cta">
              <button className="cta" onClick={pick}>
                Upload my recap <span className="cta-arrow">→</span>
              </button>
              <button className="text-link" onClick={onManual}>or type my artists</button>
            </div>
            <p className="hero-byline">
              built by{' '}
              <a href="https://www.instagram.com/dietcokecode/" target="_blank" rel="noreferrer">@dietcokecode</a>
              {' '}on instagram
            </p>
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
        <div
          className={`dropzone ${drag ? 'drag' : ''}`}
          role="button"
          tabIndex={0}
          onClick={pick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        >
          <div className="drop-icon"><span>↑</span></div>
          <p className="drop-title">{drag ? 'Let go, we got it.' : 'Drop your recap screenshot'}</p>
          <p className="drop-hint">Your top artists or top songs card works best. It's read on your phone and never uploaded.</p>
        </div>
      </section>
    </>
  );
}
