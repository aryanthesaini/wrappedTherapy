import type { Diagnostics } from '../lib/extract';

/** Collapsible "what the reader saw" panel: for tuning the parser against real screenshots. */
export default function ReaderDetails({ diag }: { diag: Diagnostics }) {
  return (
    <details className="reader card">
      <summary>
        <span className="label">what the reader saw</span>
        <span className="label">
          {diag.matched.length} matched · {diag.unknown.length} unknown · confidence {diag.meanConfidence}%{diag.pass ? ` · ${diag.pass} pass` : ''}
        </span>
      </summary>
      <div className="reader-grid">
        <div>
          <h4>Signals</h4>
          <p className="label">headings: {diag.headings.length ? diag.headings.join(' / ') : 'none'}</p>
          <p className="label">recap words: {diag.keywordHits.length ? diag.keywordHits.join(', ') : 'none'}</p>
          <h4>Matched lines</h4>
          {diag.matched.length ? (
            <ul className="reader-list">
              {diag.matched.map((m, i) => (
                <li key={i}>
                  <code>{m.line}</code> → <b>{m.artist}</b> <span className="label">{Math.round(m.score * 100)}% · {m.section}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="label">nothing matched the artist database.</p>
          )}
        </div>
        <div>
          <h4>Raw text</h4>
          <pre className="reader-raw">{diag.rawText || '(no text found)'}</pre>
        </div>
      </div>
    </details>
  );
}
