import type { ParseResult } from '../lib/extract';
import { DEBUG } from '../lib/debug';
import { Mascot } from './Doodles';
import ReaderDetails from './ReaderDetails';

type Rejection = Extract<ParseResult, { ok: false }>;

interface Props {
  rejection: Rejection;
  preview?: string;
  onRetry: () => void;
  onManual: () => void;
}

export default function Rejected({ rejection: r, preview, onRetry, onManual }: Props) {
  const soft = r.kind === 'no_artists' || r.kind === 'unreadable';
  return (
    <section className="wrap section rejected">
      <div className="rejected-grid">
        <div className="rejected-copy">
          <span className="kicker">{soft ? 'so close' : 'nice try'}</span>
          <h2 className="h1">{r.title}</h2>
          <p className="lede">{r.message}</p>
          <div className="hero-cta">
            <button className="cta" onClick={onRetry}>Try another screenshot <span className="cta-arrow">→</span></button>
            <button className="text-link" onClick={onManual}>{soft ? 'type my artists in' : 'or type them in'}</button>
          </div>
        </div>
        <div className="rejected-side">
          {preview && (
            <div className="rejected-thumb">
              <img src={preview} alt="What you uploaded" />
              <span className="stamp">{soft ? 'hmm' : 'nope'}</span>
            </div>
          )}
          <Mascot className="mascot-reject" mood={soft ? 'think' : 'sad'} />
        </div>
      </div>
      {DEBUG && r.diag && <ReaderDetails diag={r.diag} />}
    </section>
  );
}
