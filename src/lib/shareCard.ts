import type { Diagnosis, WrappedData } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';
import { findArtist } from '../data/artists';

/**
 * 1080×1920 Instagram-story PNG, styled as an album cover: the diagnosis is the
 * album title, the top conditions are the tracklist, your artists are "feat.".
 */

const W = 1080;
const H = 1920;
const INK = '#141414';
const WHITE = '#FFFFFF';
const DISPLAY = 'Unbounded, "Arial Black", sans-serif';
const BODY = '"DM Sans", system-ui, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

async function loadFonts() {
  if (!document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`900 80px Unbounded`),
    document.fonts.load(`700 40px Unbounded`),
    document.fonts.load(`italic 200px "Instrument Serif"`),
    document.fonts.load(`500 40px "DM Sans"`),
    document.fonts.load(`700 40px "DM Sans"`),
    document.fonts.load(`500 28px "JetBrains Mono"`),
  ]);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function wordmark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, align: 'left' | 'center' = 'left') {
  ctx.fillStyle = color;
  ctx.font = `700 40px ${DISPLAY}`;
  const a = ctx.measureText('wrapped').width;
  ctx.font = `italic 54px ${SERIF}`;
  const b = ctx.measureText('therapy').width;
  const start = align === 'center' ? x - (a + 8 + b) / 2 : x;
  ctx.textAlign = 'left';
  ctx.font = `700 40px ${DISPLAY}`;
  ctx.fillText('wrapped', start, y);
  ctx.font = `italic 54px ${SERIF}`;
  ctx.fillText('therapy', start + a + 8, y);
}

function drawAlbum({ ctx, d, data, accent, cond, top, artists, host }: Ctx) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  wordmark(ctx, 80, 130, WHITE);
  ctx.textAlign = 'right'; ctx.font = `500 26px ${MONO}`; ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.fillText(`SIDE A · ${data.year}`, W - 80, 126);

  // the record
  const cx = W / 2, cy = 620, r = 400;
  ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
  for (let rr = r * 0.4; rr < r * 0.98; rr += 8) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke(); }
  // shine
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.10)'); g.addColorStop(0.65, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // label
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx, cy, r * 0.36, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = `150px ${BODY}`;
  ctx.fillText(cond.emoji, cx, cy + 52);

  // album title
  ctx.fillStyle = WHITE;
  const px = fitFont(ctx, cond.short, (p) => `italic ${p}px ${SERIF}`, W - 160, 200, 96);
  ctx.fillText(cond.short, W / 2, 1190);
  fitFont(ctx, cond.tagline, (p) => `500 ${p}px ${BODY}`, W - 160, 40, 26); ctx.fillStyle = accent;
  ctx.fillText(cond.tagline, W / 2, 1190 + Math.min(80, px * 0.45));

  // tracklist
  ctx.textAlign = 'left';
  const lx = 150, rx = W - 150;
  top.forEach((id, i) => {
    const c = CONDITION_BY_ID[id];
    const y = 1390 + i * 70;
    ctx.font = `500 30px ${MONO}`; ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fillText(String(i + 1).padStart(2, '0'), lx, y);
    ctx.font = `${i === 0 ? 700 : 500} 38px ${BODY}`; ctx.fillStyle = WHITE;
    ctx.fillText(c.short, lx + 80, y);
    ctx.textAlign = 'right'; ctx.font = `500 32px ${MONO}`; ctx.fillStyle = i === 0 ? accent : 'rgba(255,255,255,.6)';
    ctx.fillText(`${Math.round(d.percentages[id] * 100)}%`, rx, y);
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, y + 26); ctx.lineTo(rx, y + 26); ctx.stroke();
  });
  ctx.textAlign = 'center';
  if (artists.length) {
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    fitFont(ctx, `feat. ${artists.join(', ')}`, (p) => `italic ${p}px ${SERIF}`, W - 260, 42, 26);
    ctx.fillText(`feat. ${artists.join(', ')}`, W / 2, 1390 + top.length * 70 + 30);
  }
  // CTA
  const ctaW = 720, ctaH = 120, ctaX = (W - ctaW) / 2, ctaY = 1690;
  ctx.fillStyle = accent; roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 60); ctx.fill();
  ctx.fillStyle = INK; ctx.font = `700 36px ${DISPLAY}`;
  ctx.fillText('press play on yours ▶', W / 2, ctaY + 58);
  ctx.font = `500 26px ${MONO}`;
  ctx.fillText(host, W / 2, ctaY + 96);
  ctx.font = `500 22px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.fillText('a parody · not medical advice', W / 2, 1870);
}

export async function renderShareCard(d: Diagnosis, data: WrappedData): Promise<Blob> {
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
  drawAlbum(c);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
