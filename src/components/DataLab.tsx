import { useMemo, useState } from 'react';
import type { ConditionId, Region } from '../types';
import { ARTISTS } from '../data/artists';
import { GENRE_BY_ID } from '../data/genres';
import { CONDITIONS, CONDITION_BY_ID } from '../data/conditions';
import { artistProfile } from '../lib/engine';

const REGIONS: (Region | 'ALL')[] = ['ALL', 'IN', 'PK', 'GLOBAL', 'KR', 'LATAM', 'AF'];

/** Internal tool for inspecting and tuning the artist → condition mapping. */
export default function DataLab() {
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<Region | 'ALL'>('ALL');
  const [cond, setCond] = useState<ConditionId | 'ALL'>('ALL');

  const rows = useMemo(() => {
    return ARTISTS.filter((a) => (region === 'ALL' || a.region === region) && a.name.toLowerCase().includes(q.toLowerCase()))
      .map((a) => {
        const p = artistProfile(a);
        const top = (Object.entries(p) as [ConditionId, number][]).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]);
        return { a, top, p };
      })
      .filter((r) => cond === 'ALL' || r.top[0]?.[0] === cond)
      .sort((x, y) => (cond === 'ALL' ? x.a.name.localeCompare(y.a.name) : y.p[cond] - x.p[cond]));
  }, [q, region, cond]);

  return (
    <section className="wrap section lab">
      <span className="label">internal · tuning</span>
      <h2 className="h1">
        Data <span className="serif-hl">lab.</span>
      </h2>
      <p className="muted">
        {ARTISTS.length} artists → {Object.keys(GENRE_BY_ID).length} genres → {CONDITIONS.length} conditions. Edit{' '}
        <code>src/data/*.ts</code> to tune.
      </p>

      <div className="lab-filters">
        <input placeholder="search artist…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={region} onChange={(e) => setRegion(e.target.value as Region | 'ALL')}>
          {REGIONS.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'all regions' : r}</option>)}
        </select>
        <select value={cond} onChange={(e) => setCond(e.target.value as ConditionId | 'ALL')}>
          <option value="ALL">any top condition</option>
          {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.short.toLowerCase()}</option>)}
        </select>
        <span className="label">{rows.length} shown</span>
      </div>

      <div className="lab-table">
        <div className="lab-row lab-headrow label">
          <span>artist</span><span>genres</span><span>leans toward</span>
        </div>
        {rows.map(({ a, top }) => (
          <div className="lab-row" key={a.name}>
            <div className="lab-artist">
              <b>{a.name}</b>
              <span className="chip small">{a.region.toLowerCase()}</span>
            </div>
            <div className="label">{a.genres.map((g) => GENRE_BY_ID[g]?.label.toLowerCase() ?? `⚠ ${g}`).join(' · ')}</div>
            <div className="chips">
              {top.slice(0, 3).map(([c, v], i) => (
                <span key={c} className={`chip small ${i === 0 ? 'on' : ''}`}>
                  {CONDITION_BY_ID[c].short.toLowerCase()} {v.toFixed(1)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
