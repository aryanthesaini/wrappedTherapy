import type { ReactNode } from 'react';

/** Hand-drawn line-art bits and motion pieces: mascot, vinyl, equaliser, floating notes. */

export function Mascot({ className = '', mood = 'happy' }: { className?: string; mood?: 'happy' | 'wave' | 'think' | 'sad' }) {
  return (
    <svg className={`mascot ${className}`} viewBox="0 0 200 240" aria-hidden="true">
      <path className="draw" d="M100 46 C 140 46, 158 72, 156 108 S 138 170, 100 170 S 42 146, 44 108 S 60 46, 100 46 Z" />
      <path className="draw" d="M48 102 C 44 50, 156 50, 152 102" />
      <rect className="draw cup" x="34" y="96" width="20" height="36" rx="8" />
      <rect className="draw cup" x="146" y="96" width="20" height="36" rx="8" />
      {mood === 'think' ? (
        <>
          <path className="draw" d="M80 104 h12 M110 104 h12" />
          <path className="draw" d="M90 130 h22" />
        </>
      ) : mood === 'sad' ? (
        <>
          <circle className="e" cx="86" cy="106" r="4.5" />
          <circle className="e" cx="116" cy="106" r="4.5" />
          <path className="draw" d="M88 134 Q 101 124, 114 134" />
        </>
      ) : (
        <>
          <circle className="e" cx="86" cy="106" r="4.5" />
          <circle className="e" cx="116" cy="106" r="4.5" />
          <path className="draw" d="M88 126 Q 101 138, 114 126" />
        </>
      )}
      <ellipse className="cheek" cx="76" cy="122" rx="7" ry="4" />
      <ellipse className="cheek" cx="126" cy="122" rx="7" ry="4" />
      <path className="draw" d="M88 170 L 82 212 L 68 214" />
      <path className="draw" d="M112 170 L 118 212 L 132 214" />
      {mood === 'wave' ? (
        <path className="draw arm-wave" d="M150 138 C 170 128, 178 110, 174 88" />
      ) : (
        <path className="draw arm" d="M50 140 C 32 148, 22 140, 16 124" />
      )}
    </svg>
  );
}

/** A spinning record. Put an image or anything in the label. */
export function Vinyl({ label, speed = 'normal', className = '' }: { label?: ReactNode; speed?: 'normal' | 'fast' | 'paused'; className?: string }) {
  return (
    <div className={`vinyl ${speed} ${className}`} aria-hidden="true">
      <div className="vinyl-disc">
        <div className="vinyl-shine" />
        <div className="vinyl-label">
          {label ?? (
            <>
              <span className="vinyl-text top">wrapped</span>
              <span className="vinyl-text bottom">therapy</span>
            </>
          )}
        </div>
        <div className="vinyl-hole" />
      </div>
      <svg className="tonearm" viewBox="0 0 120 220">
        <circle cx="96" cy="22" r="14" />
        <path d="M96 22 L 92 150 L 62 196" />
        <rect x="48" y="188" width="26" height="16" rx="4" transform="rotate(-35 61 196)" />
      </svg>
    </div>
  );
}

export function Equalizer({ bars = 7, className = '' }: { bars?: number; className?: string }) {
  return (
    <div className={`eq ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => <span key={i} style={{ ['--i' as string]: i }} />)}
    </div>
  );
}

export function FloatingNotes({ count = 6 }: { count?: number }) {
  const glyphs = ['♪', '♫', '♬', '♩'];
  return (
    <div className="float-notes" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ ['--i' as string]: i, left: `${8 + ((i * 37) % 84)}%` }}>{glyphs[i % glyphs.length]}</span>
      ))}
    </div>
  );
}

export function Squiggle() {
  return (
    <svg className="squiggle" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 12 C 40 4, 80 16, 120 8 S 180 14, 198 6" />
    </svg>
  );
}

/** Heartbeat line, drawn on loop: used for the result reveal. */
export function Ekg() {
  return (
    <svg className="ekg" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 60 H140 L160 60 L175 20 L195 105 L212 38 L226 60 H300 L318 60 L330 45 L342 60 H420 L438 60 L452 10 L470 112 L486 30 L500 60 H600" />
    </svg>
  );
}
