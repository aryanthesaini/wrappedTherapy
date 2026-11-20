import { useMemo } from 'react';

/** One-shot emoji confetti burst from the centre of its parent. */
export default function Burst({ emojis, count = 26 }: { emojis: string[]; count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 160 + Math.random() * 220;
        return {
          e: emojis[i % emojis.length],
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.7 - 80,
          r: (Math.random() * 2 - 1) * 540,
          d: Math.random() * 0.2,
          s: 0.7 + Math.random() * 0.9,
        };
      }),
    [emojis, count],
  );
  return (
    <div className="burst" aria-hidden="true">
      {parts.map((p, i) => (
        <span
          key={i}
          style={{
            ['--x' as string]: `${p.x}px`,
            ['--y' as string]: `${p.y}px`,
            ['--r' as string]: `${p.r}deg`,
            ['--s' as string]: p.s,
            animationDelay: `${p.d}s`,
          }}
        >
          {p.e}
        </span>
      ))}
    </div>
  );
}
