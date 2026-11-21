import type { Diagnosis, Therapist, WrappedData } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';
import { findArtist } from '../data/artists';

/**
 * 1080×1920 Instagram-story PNG — Option F "Bold Split" design:
 * top 54% = solid condition-colour block; bottom 46% = white with stats + therapists.
 */

const W = 1080;
const H = 1920;
const INK = '#141414';
const WHITE = '#FFFFFF';
const DISPLAY = 'Unbounded, "Arial Black", sans-serif';
const BODY = '"DM Sans", system-ui, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';

async function loadFonts() {
  if (!document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`900 165px Unbounded`),
    document.fonts.load(`900 80px Unbounded`),
    document.fonts.load(`700 40px Unbounded`),
    document.fonts.load(`italic 50px "Instrument Serif"`),
    document.fonts.load(`700 40px "DM Sans"`),
    document.fonts.load(`500 27px "DM Sans"`),
  ]);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, width: number, max: number, min: number) {
  let px = max;
  ctx.font = font(px);
  while (px > min && ctx.measureText(text).width > width) {
    px -= 4;
    ctx.font = font(px);
  }
  return px;
}

interface Ctx {
  ctx: CanvasRenderingContext2D;
  d: Diagnosis;
  data: WrappedData;
  accent: string;
  cond: (typeof CONDITION_BY_ID)[keyof typeof CONDITION_BY_ID];
  top: Diagnosis['ranked'];
  artists: string[];
  host: string;
}

function drawOptionF({ ctx, d, data, accent, cond, top, artists, host }: Ctx, therapists: Therapist[]) {
  const TOP_H = Math.round(H * 0.54); // ≈ 1037
  const PAD = 85;

  // ══ TOP: colour block ══
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, TOP_H);

  // Ghost initial — large, 7% white, bleeds off the right edge
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 530px ${DISPLAY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillText(cond.short[0].toUpperCase(), W + 42, 420);
  ctx.restore();

  // Wordmark: "wrapped" (Unbounded 700) + "therapy" (Instrument Serif italic)
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `700 36px ${DISPLAY}`;
  const ww = ctx.measureText('wrapped').width;
  ctx.fillText('wrapped', PAD, 165);
  ctx.font = `italic 50px ${SERIF}`;
  ctx.fillText('therapy', PAD + ww + 12, 165);

  // Year badge — right-aligned, bordered pill
  const yr = String(data.year);
  ctx.font = `700 27px ${DISPLAY}`;
  const yrW = ctx.measureText(yr).width;
  const badgeW = yrW + 48;
  const badgeX = W - PAD - badgeW;
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2.5;
  roundRect(ctx, badgeX, 136, badgeW, 44, 10);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(yr, badgeX + 24, 165);

  // Handle — sits just below the wordmark row
  ctx.font = `500 26px ${BODY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('@dietcokecode', PAD, 215);

  // Diagnosis label
  ctx.font = `500 27px ${BODY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('Dr. Playlist diagnoses you with', PAD, 510);

  // Condition name — scaled to fit the full available width
  const namePx = fitFont(ctx, cond.short, (p) => `900 ${p}px ${DISPLAY}`, W - PAD * 2, 165, 48);
  ctx.fillStyle = WHITE;
  ctx.fillText(cond.short, PAD, 510 + 36 + namePx);
  const nameBaseY = 510 + 36 + namePx;

  // Tagline
  fitFont(ctx, `"${cond.tagline}"`, (p) => `italic ${p}px ${SERIF}`, W - PAD * 2, 48, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`"${cond.tagline}"`, PAD, nameBaseY + 70);

  // Artist credit — anchored near the bottom of the colour block
  if (artists.length) {
    const thanks = `thanks to ${artists.join(' & ')}`;
    fitFont(ctx, thanks, (p) => `italic ${p}px ${SERIF}`, W - PAD * 2, 40, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(thanks, PAD, TOP_H - 68);
  }

  // ══ BOTTOM: white section ══
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, TOP_H, W, H - TOP_H);

  let bY = TOP_H + 54;

  // Confidence row
  const confPct = `${Math.round(d.confidence * 100)}%`;
  ctx.font = `900 72px ${DISPLAY}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText(confPct, PAD, bY + 52);
  const confNumW = ctx.measureText(confPct).width;

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(PAD + confNumW + 32, bY + 8, 2.5, 58);

  ctx.font = `500 26px ${BODY}`;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillText('confidence match', PAD + confNumW + 50, bY + 28);
  ctx.font = `700 34px ${BODY}`;
  ctx.fillStyle = INK;
  ctx.fillText(d.severity.toUpperCase(), PAD + confNumW + 50, bY + 68);
  bY += 100;

  // Section divider
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.fillRect(PAD, bY, W - PAD * 2, 2);
  bY += 28;

  // Secondary conditions
  const secConds = top.slice(1).slice(0, 2);
  if (secConds.length > 0) {
    ctx.font = `700 24px ${BODY}`;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.textAlign = 'left';
    ctx.fillText('ALSO SHOWING UP', PAD, bY);
    bY += 36;

    for (const id of secConds) {
      const pct = Math.round(d.percentages[id] * 100);
      const condName = CONDITION_BY_ID[id].short;
      const barW = W - PAD * 2;
      const fillW = Math.max((pct / 100) * barW, 0);

      ctx.font = `700 36px ${DISPLAY}`;
      ctx.fillStyle = INK;
      ctx.textAlign = 'left';
      ctx.fillText(condName, PAD, bY);

      ctx.font = `900 40px ${DISPLAY}`;
      ctx.fillStyle = accent;
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, W - PAD, bY);
      bY += 22;

      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      roundRect(ctx, PAD, bY, barW, 11, 5);
      ctx.fill();
      if (fillW > 0) {
        ctx.fillStyle = accent;
        roundRect(ctx, PAD, bY, fillW, 11, 5);
        ctx.fill();
      }
      bY += 42;
    }
    bY += 4;
  }

  // Recommended therapists
  if (therapists.length > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(PAD, bY, W - PAD * 2, 2);
    bY += 28;

    ctx.font = `700 24px ${BODY}`;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.textAlign = 'left';
    ctx.fillText('RECOMMENDED NEAR YOU', PAD, bY);
    bY += 44;

    for (const t of therapists.slice(0, 2)) {
      const initials = t.name
        .replace(/^(Dr\.|Mr\.|Ms\.)\s+/, '')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const avatarR = 40;
      const avatarCX = PAD + avatarR;
      const avatarCY = bY + avatarR;

      // Avatar circle
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = WHITE;
      ctx.font = `700 28px ${BODY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, avatarCX, avatarCY);
      ctx.textBaseline = 'alphabetic';

      // Name + subtitle
      const textX = PAD + avatarR * 2 + 24;
      const maxNameW = W - textX - PAD;
      ctx.textAlign = 'left';

      fitFont(ctx, t.name, (p) => `700 ${p}px ${BODY}`, maxNameW, 34, 20);
      ctx.fillStyle = INK;
      ctx.fillText(t.name, textX, bY + 30);

      const subtitle = `${t.title} · ${t.city}`;
      fitFont(ctx, subtitle, (p) => `500 ${p}px ${BODY}`, maxNameW, 26, 18);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillText(subtitle, textX, bY + 62);

      bY += avatarR * 2 + 28;
    }
  }

  // Push CTA toward the bottom
  const ctaH = 118;
  const bylineH = 48;
  const minCTAY = H - ctaH - bylineH - 36;
  bY = Math.max(bY + 20, minCTAY);

  // CTA block
  ctx.fillStyle = INK;
  roundRect(ctx, PAD, bY, W - PAD * 2, ctaH, 24);
  ctx.fill();

  ctx.font = `700 36px ${DISPLAY}`;
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'left';
  ctx.fillText('Get your diagnosis', PAD + 42, bY + 50);
  ctx.font = `500 26px ${BODY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(host, PAD + 42, bY + 86);

  // Arrow circle on CTA right side
  const arrowCX = W - PAD - 42;
  const arrowCY = bY + ctaH / 2;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(arrowCX, arrowCY, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = `700 36px ${DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('↗', arrowCX, arrowCY);
  ctx.textBaseline = 'alphabetic';

  bY += ctaH + 20;

  // Byline
  ctx.font = `500 24px ${BODY}`;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.textAlign = 'center';
  ctx.fillText('built by @dietcokecode on instagram', W / 2, bY);
}

export async function renderShareCard(d: Diagnosis, data: WrappedData, therapists: Therapist[] = []): Promise<Blob> {
  await loadFonts();
  const cond = CONDITION_BY_ID[d.primary];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';
  const c: Ctx = {
    ctx,
    d,
    data,
    cond,
    accent: cond.color,
    top: d.ranked.filter((id) => d.percentages[id] >= 0.01).slice(0, 3),
    artists: data.topArtists.filter((a) => findArtist(a)).slice(0, 2),
    host: location.host || 'wrappedtherapy',
  };
  drawOptionF(c, therapists);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
