import type { Diagnosis, WrappedData } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';
import { findArtist } from '../data/artists';

/**
 * 1080×1920 Instagram-story PNG, "paper" style: off-white, lots of space, the
 * diagnosis under a marker highlight, one big number, and a clear CTA.
 */

const W = 1080;
const H = 1920;
const INK = '#141414';
const WHITE = '#FFFFFF';
const PAPER = '#FBF8F3';
const MUTED = '#6E6A62';
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

function drawPaper({ ctx, d, data, accent, cond, top, artists, host }: Ctx) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  // thin rounded frame
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  roundRect(ctx, 50, 50, W - 100, H - 100, 40);
  ctx.stroke();

  // header
  wordmark(ctx, W / 2, 190, INK, 'center');
  ctx.textAlign = 'center';
  ctx.font = `500 26px ${MONO}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(`MY ${data.year} DIAGNOSIS`, W / 2, 250);

  // emoji
  ctx.font = `150px ${BODY}`;
  ctx.fillText(cond.emoji, W / 2, 560);

  // diagnosis with a marker highlight
  const nameY = 820;
  const px = fitFont(ctx, cond.short, (p) => `italic ${p}px ${SERIF}`, W - 220, 230, 100);
  const nw = ctx.measureText(cond.short).width;
  ctx.fillStyle = accent;
  ctx.fillRect(W / 2 - nw / 2 - 18, nameY - px * 0.34, nw + 36, px * 0.32);
  ctx.fillStyle = INK;
  ctx.fillText(cond.short, W / 2, nameY);

  // tagline
  fitFont(ctx, cond.tagline, (p) => `italic ${p}px ${SERIF}`, W - 240, 58, 34);
  ctx.fillText(cond.tagline, W / 2, nameY + 120);

  // one big number
  const pct = Math.round(d.confidence * 100);
  ctx.font = `900 200px ${DISPLAY}`;
  ctx.fillText(`${pct}%`, W / 2, 1370);
  ctx.font = `500 34px ${BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(`match · ${d.severity.toLowerCase()}`, W / 2, 1430);

  // the rest of the chart, as one quiet line
  const rest = top.slice(1).map((id) => `${CONDITION_BY_ID[id].short.toLowerCase()} ${Math.round(d.percentages[id] * 100)}%`).join('  ·  ');
  if (rest) {
    ctx.fillStyle = INK;
    fitFont(ctx, `also: ${rest}`, (p) => `500 ${p}px ${MONO}`, W - 240, 30, 20);
    ctx.fillText(`also: ${rest}`, W / 2, 1505);
  }
  if (artists.length) {
    const thanks = `thanks to ${artists.join(' & ')}`;
    fitFont(ctx, thanks, (p) => `italic ${p}px ${SERIF}`, W - 240, 44, 28);
    ctx.fillStyle = INK;
    ctx.fillText(thanks, W / 2, 1585);
  }

  // CTA
  const ctaW = 640, ctaH = 120, ctaX = (W - ctaW) / 2, ctaY = 1660;
  ctx.fillStyle = INK;
  roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 60);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = `700 38px ${DISPLAY}`;
  ctx.fillText('get yours →', W / 2, ctaY + 58);
  ctx.font = `500 26px ${MONO}`;
  ctx.fillStyle = accent;
  ctx.fillText(host, W / 2, ctaY + 96);

  ctx.font = `500 22px ${BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText('a parody · not medical advice', W / 2, 1835);
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
  drawPaper(c);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
