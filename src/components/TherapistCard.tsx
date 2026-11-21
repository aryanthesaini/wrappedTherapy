import type { ConditionId, Therapist } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';

const TINTS = ['a', 'b', 'c', 'd'];

export default function TherapistCard({ t, highlight, index = 0 }: { t: Therapist; highlight: ConditionId; index?: number }) {
  const initials = t.name.replace('Dr. ', '').replace('Mr. ', '').replace('Ms. ', '').split(' ').map((p) => p[0]).join('').slice(0, 2);
  return (
    <article className="t-card" style={{ ['--i' as string]: index }}>
      <div className="t-top">
        <div className={`avatar tint-${TINTS[t.hue % 4]}`}>{initials}</div>
        <div className="grow">
          <h4>{t.name}</h4>
          <span className="t-sub">{t.title} · {t.experienceYears} yrs</span>
        </div>
      </div>
      <p className="t-bio">{t.bio}</p>
      <div className="tags">
        {t.specialties.map((s) => (
          <span key={s} className={`tag ${s === highlight ? 'on' : ''}`}>{CONDITION_BY_ID[s].short}</span>
        ))}
      </div>
      <div className="t-facts">
        <span>📍 {t.city} · {t.mode}</span>
        {t.feeInr != null && <span>₹{t.feeInr.toLocaleString('en-IN')}/session</span>}
      </div>
      {t.profileUrl
        ? <a className="btn block" href={t.profileUrl} target="_blank" rel="noopener noreferrer">View profile on Practo ↗</a>
        : <button className="btn block" disabled>Profile unavailable</button>
      }
    </article>
  );
}
