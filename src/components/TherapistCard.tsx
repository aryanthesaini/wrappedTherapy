import type { ConditionId, Therapist } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';

const TINTS = ['a', 'b', 'c', 'd'];

export default function TherapistCard({ t, highlight, index = 0 }: { t: Therapist; highlight: ConditionId; index?: number }) {
  const initials = t.name.replace('Dr. ', '').split(' ').map((p) => p[0]).join('');
  return (
    <article className="t-card" style={{ ['--i' as string]: index }}>
      <span className="t-fictional">fictional</span>
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
        <span>★ {t.rating} <i>({t.reviews})</i></span>
        <span>₹{t.feeInr.toLocaleString('en-IN')}/session</span>
      </div>
      <button className="btn block" onClick={() => alert('Booking is not wired up yet.')}>Book a session</button>
    </article>
  );
}
