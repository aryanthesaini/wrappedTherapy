import type { Platform } from '../types';
import { preflight } from './validate';
import { isMostlyDark, preprocess, recognize } from './ocr';
import { extractWrapped, type ParseResult } from './extract';

export type ParseStage = 'checking' | 'loading' | 'reading' | 'second-look' | 'matching';
export type ParseProgress = { stage: ParseStage; pct?: number };

/**
 * Screenshot → WrappedData, fully in the browser:
 * 1. preflight checks (type, size, resolution, shape)
 * 2. OCR pass on a contrast-normalised image
 * 3. if that found few artists, a second pass with inverted contrast
 * 4. extraction + "is this a recap?" checks on the better pass
 */
export async function parseWrapped(
  file: File,
  platform: Platform,
  onProgress: (p: ParseProgress) => void = () => {},
): Promise<ParseResult> {
  onProgress({ stage: 'checking' });
  const pre = await preflight(file);
  if (!pre.ok) return { ok: false, kind: 'invalid_file', title: pre.title, message: pre.message };

  const { bitmap } = pre;
  try {
    const dark = isMostlyDark(bitmap);
    const pass = async (invert: boolean, stage: ParseStage) => {
      const lines = await recognize(preprocess(bitmap, invert), (p) => {
        if (p.status.startsWith('recognizing')) onProgress({ stage, pct: Math.round(p.progress * 100) });
        else if (stage === 'reading') onProgress({ stage: 'loading' });
      });
      const result = extractWrapped(lines, platform);
      if (result.diag) result.diag.pass = invert ? 'inverted' : 'normal';
      return result;
    };
    const score = (r: ParseResult) => (r.ok ? 100 + r.data.topArtists.length : r.diag?.matched.length ?? 0);

    let best = await pass(dark, 'reading');
    if (!best.ok || best.diag.matched.length < 3) {
      const second = await pass(!dark, 'second-look');
      if (score(second) > score(best)) best = second;
    }
    onProgress({ stage: 'matching' });
    return best;
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      kind: 'unreadable',
      title: 'The reader didn\'t load.',
      message: 'We couldn\'t start the text reader. Check your connection (it downloads once, the first time) and try again.',
    };
  } finally {
    bitmap.close();
  }
}
