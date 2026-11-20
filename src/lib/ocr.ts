import { createWorker, PSM, type Worker } from 'tesseract.js';
import type { OcrLine } from './extract';

/**
 * Browser OCR via Tesseract.js. The engine + English model (~a few MB) download
 * once from the CDN on first use; images never leave the device.
 */

export type OcrProgress = { status: string; progress: number };

let workerPromise: Promise<Worker> | null = null;
let listener: ((p: OcrProgress) => void) | null = null;

function getWorker() {
  workerPromise ??= createWorker('eng', 1, {
    logger: (m) => listener?.({ status: m.status, progress: m.progress }),
  }).then(async (w) => {
    await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: '1' });
    return w;
  });
  workerPromise.catch(() => (workerPromise = null));
  return workerPromise;
}

/**
 * Grayscale + contrast stretch, scaled to a size OCR likes.
 * Recap cards often use light text on dark backgrounds, so `invert` flips that.
 */
export function preprocess(bitmap: ImageBitmap, invert: boolean): HTMLCanvasElement {
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(2400 / longest, Math.max(1, 1600 / bitmap.width));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;

  // Luminance histogram for a 2%–98% contrast stretch.
  const gray = new Uint8ClampedArray(w * h);
  const hist = new Uint32Array(256);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const g = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
    gray[j] = g;
    hist[gray[j]]++;
  }
  const pct = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= p * gray.length) return v;
    return 255;
  };
  let lo = pct(0.02);
  let hi = pct(0.98);
  // Mostly-flat images (white card, sparse text) would collapse to one colour: skip the stretch.
  if (hi - lo < 64) {
    lo = 0;
    hi = 255;
  }

  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    let v = ((gray[j] - lo) * 255) / (hi - lo);
    if (invert) v = 255 - v;
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** True when most of the image is dark, i.e. light text on a dark card. */
export function isMostlyDark(bitmap: ImageBitmap): boolean {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = Math.max(1, Math.round((64 * bitmap.height) / bitmap.width));
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
  return sum / (d.length / 4) < 120;
}

export async function recognize(canvas: HTMLCanvasElement, onProgress?: (p: OcrProgress) => void): Promise<OcrLine[]> {
  listener = onProgress ?? null;
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(canvas);
    return data.lines.map((l) => ({ text: l.text, confidence: l.confidence, bbox: l.bbox }));
  } finally {
    listener = null;
  }
}
