import type { Diagnosis, WrappedData } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';
import { findArtist } from '../data/artists';

/**
 * Renders a 1080×1920 (Instagram story) PNG of the diagnosis, entirely on a canvas.
 * Same visual language as the app: paper, ink outlines, the condition colour as a marker.
 */

const W = 1080;
const H = 1920;
const INK = '#141414';
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
    document.fonts.load(`italic 150px "Instrument Serif"`),
    document.fonts.load(`500 32px "DM Sans"`),
    document.fonts.load(`700 32px "DM Sans"`),
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

/** Card with a hard offset shadow, like the UI. */
function inkBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, shadow = 16) {
  ctx.fillStyle = INK;
  roundRect(ctx, x + shadow, y + shadow, w, h, r);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:]*\S*$/, '') + '…';
  }
  return lines;
}

/** Largest font size (≤ max) at which `text` fits `width`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, width: number, max: number, min: number) {
  let px = max;
  ctx.font = font(px);
  while (px > min && ctx.measureText(text).width > width) {
    px -= 4;
    ctx.font = font(px);
  }
  return px;
}

function drawVinyl(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, label: string) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(cx + 14, cy + 18, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  for (let rr = r * 0.38; rr < r * 0.97; rr += 9) {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = label;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.33, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export async function renderShareCard(d: Diagnosis, data: WrappedData): Promise<Blob> {
  await loadFonts();
  const cond = CONDITION_BY_ID[d.primary];
  const accent = cond.color;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';

  // ── background: paper, blob, record, notes ──
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#D4F55B';
  ctx.beginPath();
  ctx.ellipse(930, 250, 330, 290, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  drawVinyl(ctx, 150, 1760, 330, accent);
  ctx.fillStyle = INK;
  ctx.font = `64px ${BODY}`;
  ctx.fillText('♪', 900, 1470);
  ctx.fillText('♫', 960, 1560);

  // ── logo ──
  ctx.fillStyle = INK;
  ctx.font = `700 46px ${DISPLAY}`;
  ctx.fillText('wrapped', 80, 140);
  const lw = ctx.measureText('wrapped').width;
  ctx.font = `italic 60px ${SERIF}`;
  ctx.fillText('therapy', 80 + lw + 10, 140);

  // ── prescription card ──
  const cx = 70;
  const cy = 230;
  const cw = 920;
  const ch = 1360;
  inkBox(ctx, cx, cy, cw, ch, 44, '#FFFFFF');
  // header band
  ctx.save();
  roundRect(ctx, cx, cy, cw, ch, 44);
  ctx.clip();
  ctx.fillStyle = accent;
  ctx.fillRect(cx, cy, cw, 130);
  // ruled lines
  ctx.strokeStyle = '#ECE7DD';
  ctx.lineWidth = 2;
  for (let y = cy + 190; y < cy + ch; y += 58) {
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + cw, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 130);
  ctx.lineTo(cx + cw, cy + 130);
  ctx.stroke();
  roundRect(ctx, cx, cy, cw, ch, 44);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = `700 40px ${DISPLAY}`;
  ctx.fillText('Dr. Playlist', cx + 50, cy + 70);
  ctx.font = `500 26px ${BODY}`;
  ctx.fillText('Dept. of Questionable Listening', cx + 50, cy + 108);
  ctx.font = `500 26px ${MONO}`;
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  ctx.textAlign = 'right';
  ctx.fillText(date, cx + cw - 50, cy + 78);
  ctx.textAlign = 'left';

  // kicker pill
  const kicker = `℞  YOUR ${data.year} DIAGNOSIS`;
  ctx.font = `700 26px ${BODY}`;
  const kw = ctx.measureText(kicker).width + 48;
  ctx.lineWidth = 4;
  roundRect(ctx, cx + 50, cy + 180, kw, 60, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillText(kicker, cx + 74, cy + 220);

  // emoji + condition name with marker highlight
  ctx.font = `130px ${BODY}`;
  ctx.fillText(cond.emoji, cx + 46, cy + 410);
  const nameX = cx + 50;
  const nameY = cy + 590;
  const px = fitFont(ctx, cond.short, (p) => `italic ${p}px ${SERIF}`, cw - 100, 170, 84);
  const nw = ctx.measureText(cond.short).width;
  ctx.fillStyle = accent;
  ctx.fillRect(nameX - 10, nameY - px * 0.36, nw + 24, px * 0.34);
  ctx.fillStyle = INK;
  ctx.fillText(cond.short, nameX, nameY);
  ctx.font = `500 32px ${BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(cond.name, nameX, nameY + 60);

  // the joke
  ctx.font = `italic 46px ${SERIF}`;
  ctx.fillStyle = INK;
  const quote = wrapLines(ctx, `“${cond.musicTell}”`, cw - 120, 2);
  quote.forEach((l, i) => ctx.fillText(l, nameX, nameY + 150 + i * 58));

  // chart: top conditions as bars
  const chartTop = cy + 875;
  ctx.font = `700 24px ${BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText('YOUR CHART', nameX, chartTop);
  const top = d.ranked.filter((id) => d.percentages[id] >= 0.01).slice(0, 3);
  const trackX = cx + 380;
  const trackW = cw - 380 - 150;
  top.forEach((id, i) => {
    const c = CONDITION_BY_ID[id];
    const y = chartTop + 34 + i * 56;
    const p = d.percentages[id];
    ctx.fillStyle = INK;
    ctx.font = `${i === 0 ? 700 : 500} 30px ${BODY}`;
    const label = `${c.emoji}  ${c.short}`;
    const lpx = fitFont(ctx, label, (s) => `${i === 0 ? 700 : 500} ${s}px ${BODY}`, trackX - nameX - 20, 30, 20);
    ctx.font = `${i === 0 ? 700 : 500} ${lpx}px ${BODY}`;
    ctx.fillText(label, nameX, y + 24);
    // track + fill
    roundRect(ctx, trackX, y, trackW, 30, 15);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.save();
    roundRect(ctx, trackX, y, trackW, 30, 15);
    ctx.clip();
    ctx.fillStyle = i === 0 ? accent : '#CDBBFF';
    ctx.fillRect(trackX, y, Math.max(trackW * p, 6), 30);
    ctx.restore();
    roundRect(ctx, trackX, y, trackW, 30, 15);
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = i === 0 ? INK : MUTED;
    ctx.font = `700 28px ${BODY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(p * 100)}%`, cx + cw - 50, y + 25);
    ctx.textAlign = 'left';
  });

  // score dial
  const dx = cx + 150;
  const dy = cy + ch - 175;
  const pct = Math.round(d.confidence * 100);
  ctx.lineWidth = 34;
  ctx.strokeStyle = '#E7E2D8';
  ctx.beginPath();
  ctx.arc(dx, dy, 100, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(dx, dy, 100, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct) / 100);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.arc(dx, dy, 118, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(dx, dy, 82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `900 42px ${DISPLAY}`;
  ctx.fillText(`${pct}%`, dx, dy + 10);
  ctx.font = `500 22px ${BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(d.severity.toLowerCase(), dx, dy + 46);
  ctx.textAlign = 'left';

  // prescribed by (top known artists)
  const artists = data.topArtists.filter((a) => findArtist(a)).slice(0, 3);
  const ax = cx + 330;
  ctx.font = `700 24px ${BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText('PRESCRIBED BY', ax, dy - 70);
  ctx.fillStyle = INK;
  artists.forEach((a, i) => {
    const size = fitFont(ctx, a, (p) => `700 ${p}px ${DISPLAY}`, cw - 400, 40, 24);
    ctx.font = `700 ${size}px ${DISPLAY}`;
    ctx.fillText(a, ax, dy - 18 + i * 56);
  });

  // stamp
  ctx.save();
  ctx.translate(cx + cw - 230, cy + 350);
  ctx.rotate(-0.2);
  ctx.strokeStyle = '#E0245E';
  ctx.fillStyle = '#E0245E';
  ctx.lineWidth = 7;
  ctx.font = `900 46px ${DISPLAY}`;
  const sw = ctx.measureText('DIAGNOSED').width + 50;
  roundRect(ctx, -sw / 2, -46, sw, 82, 12);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillText('DIAGNOSED', 0, 16);
  ctx.restore();

  // ── footer ──
  ctx.textAlign = 'right';
  ctx.fillStyle = INK;
  ctx.font = `700 34px ${DISPLAY}`;
  ctx.fillText('get yours →', W - 80, 1700);
  ctx.font = `500 30px ${MONO}`;
  ctx.fillText(location.host || 'wrappedtherapy', W - 80, 1750);
  ctx.font = `500 24px ${BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText('a parody · not medical advice', W - 80, 1840);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
