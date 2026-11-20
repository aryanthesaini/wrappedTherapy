import { useState } from 'react';
import type { WrappedData } from '../types';
import { ARTIST_NAMES, findArtist } from '../data/artists';
import { CITY_OPTIONS } from '../data/therapists';
import type { Diagnostics } from '../lib/extract';
import { DEBUG } from '../lib/debug';
import ReaderDetails from './ReaderDetails';

interface Props {
  data: WrappedData;
  diag?: Diagnostics;
  preview?: string;
  city: string;
  onCity: (c: string) => void;
  onChange: (d: WrappedData) => void;
  onDiagnose: () => void;
  onBack: () => void;
}

export default function Review({ data, diag, preview, city, onCity, onChange, onDiagnose }: Props) {
  const [draft, setDraft] = useState('');

  const setArtists = (topArtists: string[]) => onChange({ ...data, topArtists });
  const move = (i: number, dir: -1 | 1) => {
    const a = [...data.topArtists];
    const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setArtists(a);
  };
  const add = () => {
    const name = draft.trim();
    if (!name || data.topArtists.length >= 10) return;
    setArtists([...data.topArtists, findArtist(name)?.name ?? name]);
    setDraft('');
  };
  const empty = !data.topArtists.length;

  return (
    <section className="wrap section review">
      <div className="review-head">
        <div>
          <span className="kicker">step 2 of 3</span>
          <h2 className="h1">{empty ? <>Who's on <em className="serif-hl">repeat?</em></> : <>Here's what we <em className="serif-hl">heard.</em></>}</h2>
          <p className="lede">{empty ? 'Add your top artists, most-played first.' : 'Fix anything we got wrong. Your #1 counts the most.'}</p>
        </div>
        {preview && <img className="thumb" src={preview} alt="Your recap" />}
      </div>

      <div className={`review-grid ${data.topSongs.length ? '' : 'single'}`}>
        <div className="card pop-in">
          <h3>Top artists</h3>
          <ol className="list">
            {data.topArtists.map((name, i) => {
              const known = !!findArtist(name);
              return (
                <li key={name + i} style={{ ['--i' as string]: i }}>
                  <span className="n">{i + 1}</span>
                  <span className="grow">{name}</span>
                  {!known && <span className="tag warn" title="We don't know this one yet, so it won't count">new to us</span>}
                  <span className="row-actions">
                    <button onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                    <button onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                    <button onClick={() => setArtists(data.topArtists.filter((_, k) => k !== i))} aria-label="Remove">✕</button>
                  </span>
                </li>
              );
            })}
          </ol>
          {data.topArtists.length < 10 && (
            <div className="add-row">
              <input
                list="artist-options"
                value={draft}
                placeholder="Add an artist…"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <datalist id="artist-options">
                {ARTIST_NAMES.map((n) => <option key={n} value={n} />)}
              </datalist>
              <button className="btn" onClick={add}>Add</button>
            </div>
          )}
        </div>

        {data.topSongs.length > 0 && (
          <div className="card pop-in delay">
            <h3>Top songs</h3>
            <ol className="list">
              {data.topSongs.map((s, i) => (
                <li key={s.title + i} style={{ ['--i' as string]: i }}>
                  <span className="n">{i + 1}</span>
                  <div className="grow">
                    <div className="song-title">{s.title}</div>
                    {(s.artists?.length || s.artist) && (
                      <div className="song-artist">{(s.artists?.length ? s.artists : [s.artist]).join(', ')}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {(data.topGenre || data.minutesListened) && (
              <div className="stats">
                {data.topGenre && <div><span>top genre</span><b>{data.topGenre}</b></div>}
                {data.minutesListened && <div><span>minutes</span><b>{data.minutesListened.toLocaleString()}</b></div>}
              </div>
            )}
          </div>
        )}
      </div>

      {DEBUG && diag && <ReaderDetails diag={diag} />}

      <div className="review-foot">
        <label className="field">
          <span>Find therapists near</span>
          <select value={city} onChange={(e) => onCity(e.target.value)}>
            <option value="">Anywhere / online</option>
            {CITY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button className="cta big" disabled={empty} onClick={onDiagnose}>
          Diagnose me <span className="cta-arrow">→</span>
        </button>
      </div>
    </section>
  );
}
