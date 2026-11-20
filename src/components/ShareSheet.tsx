import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Diagnosis, WrappedData } from '../types';
import { CONDITION_BY_ID } from '../data/conditions';
import { renderShareCard } from '../lib/shareCard';

interface Props {
  diagnosis: Diagnosis;
  data: WrappedData;
  onClose: () => void;
}

/** Preview of the story image, with native share (Instagram, WhatsApp…) or download. */
export default function ShareSheet({ diagnosis, data, onClose }: Props) {
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState<string>();
  const [status, setStatus] = useState<string>();
  const cond = CONDITION_BY_ID[diagnosis.primary];
  const text = `Dr. Playlist diagnosed my ${data.year} recap: ${cond.emoji} ${cond.short}. Get yours → ${location.origin}`;

  useEffect(() => {
    let alive = true;
    let objectUrl: string | undefined;
    renderShareCard(diagnosis, data).then((blob) => {
      if (!alive) return;
      const f = new File([blob], `wrapped-therapy-${cond.short.toLowerCase().replace(/\W+/g, '-')}.png`, { type: 'image/png' });
      objectUrl = URL.createObjectURL(blob);
      setFile(f);
      setUrl(objectUrl);
    });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      window.removeEventListener('keydown', onKey);
    };
  }, [diagnosis, data, cond.short, onClose]);

  const canShareFile = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  const share = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: 'My Wrapped Therapy diagnosis', text });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('Sharing failed. Save the image instead.');
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Caption copied.');
    } catch {
      setStatus('Could not copy.');
    }
  };

  // Portal to <body>: an animated ancestor (transform) would otherwise trap position: fixed.
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Share your diagnosis">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Close">✕</button>
        <h3>Post it. Let them worry.</h3>
        <div className="sheet-preview">
          {url ? <img src={url} alt={`Diagnosis card: ${cond.short}`} /> : <div className="sheet-loading"><span className="logo-disc" /> drawing your card…</div>}
        </div>
        <div className="sheet-actions">
          {canShareFile ? (
            <button className="cta" onClick={share} disabled={!file}>Share to Instagram & more <span className="cta-arrow">↗</span></button>
          ) : (
            <a className={`cta ${file ? '' : 'disabled'}`} href={url} download={file?.name}>Save image <span className="cta-arrow">↓</span></a>
          )}
          <div className="sheet-secondary">
            {canShareFile && url && <a className="text-link" href={url} download={file?.name}>save image</a>}
            <button className="text-link" onClick={copyText}>copy caption</button>
          </div>
          {!canShareFile && <p className="fine">On your phone this opens Instagram, WhatsApp and the rest directly.</p>}
          {status && <p className="fine">{status}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
