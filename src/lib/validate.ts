/** Checks that run before any OCR, to reject obviously-wrong uploads fast and for free. */

export type PreflightResult =
  | { ok: true; bitmap: ImageBitmap }
  | { ok: false; title: string; message: string };

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 15 * 1024 * 1024;
const MIN_BYTES = 8 * 1024;
const MIN_SIDE = 320;
/** width / height. Recaps are tall phone screenshots; allow square-ish crops, reject wide images. */
const MAX_ASPECT = 1.35;

export async function preflight(file: File): Promise<PreflightResult> {
  if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    return { ok: false, title: 'HEIC photos aren\'t supported.', message: 'Take a screenshot of your recap (PNG) or convert the photo to JPG, then try again.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, title: 'That\'s not a screenshot.', message: 'Upload a PNG, JPG or WebP screenshot of your music recap.' };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, title: 'That file is huge.', message: 'Keep it under 15 MB. A normal phone screenshot is well under that.' };
  }
  if (file.size < MIN_BYTES) {
    return { ok: false, title: 'That image is tiny.', message: 'It\'s too small to read. Upload the original screenshot, not a thumbnail.' };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, title: 'We couldn\'t open that image.', message: 'The file looks damaged or isn\'t really an image. Try another screenshot.' };
  }

  const { width, height } = bitmap;
  if (Math.min(width, height) < MIN_SIDE) {
    bitmap.close();
    return { ok: false, title: 'Too low-res to read.', message: `That's ${width}×${height}px. Upload the full-size screenshot from your phone.` };
  }
  if (width / height > MAX_ASPECT) {
    bitmap.close();
    return {
      ok: false,
      title: 'That\'s a wide image.',
      message: 'Music recaps are tall phone screenshots. Open your Wrapped / Recap / Replay in the app and screenshot the top artists card.',
    };
  }
  return { ok: true, bitmap };
}
