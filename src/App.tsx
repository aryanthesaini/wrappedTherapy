import { useState } from 'react';
import type { Diagnosis, Platform, WrappedData } from './types';
import { parseWrapped, type ParseProgress } from './lib/parser';
import type { Diagnostics, ParseResult } from './lib/extract';
import { diagnose } from './lib/engine';
import { DEBUG } from './lib/debug';
import Upload from './components/Upload';
import Scanning from './components/Scanning';
import Rejected from './components/Rejected';
import Review from './components/Review';
import Result from './components/Result';
import DataLab from './components/DataLab';

type Step = 'upload' | 'scanning' | 'rejected' | 'review' | 'result';
type Rejection = Extract<ParseResult, { ok: false }>;

const emptyWrapped = (platform: Platform): WrappedData => ({
  platform,
  year: new Date().getFullYear(),
  topArtists: [],
  topSongs: [],
});

export default function App() {
  const [tab, setTab] = useState<'app' | 'lab'>('app');
  const [step, setStep] = useState<Step>('upload');
  /** Fallback only: the reader detects the platform from the screenshot text. */
  const platform: Platform = 'spotify';
  const [preview, setPreview] = useState<string>();
  const [progress, setProgress] = useState<ParseProgress>({ stage: 'checking' });
  const [rejection, setRejection] = useState<Rejection>();
  const [data, setData] = useState<WrappedData>();
  const [diag, setDiag] = useState<Diagnostics>();
  const [city, setCity] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<Diagnosis>();

  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const onFile = async (file: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined);
    setProgress({ stage: 'checking' });
    setStep('scanning');
    top();
    const res = await parseWrapped(file, platform, setProgress);
    if (res.ok) {
      setData(res.data);
      setDiag(res.diag);
      setStep('review');
    } else {
      setRejection(res);
      setStep('rejected');
    }
  };

  const onManual = (partial?: WrappedData, partialDiag?: Diagnostics) => {
    setData(partial ?? emptyWrapped(platform));
    setDiag(partialDiag);
    setStep('review');
    top();
  };

  const onDiagnose = () => {
    if (!data) return;
    setDiagnosis(diagnose(data));
    setStep('result');
    top();
  };

  const reset = () => {
    setTab('app');
    setStep('upload');
    setData(undefined);
    setDiag(undefined);
    setDiagnosis(undefined);
    setRejection(undefined);
    top();
  };

  return (
    <>
      <header className="nav">
        <div className="wrap nav-inner">
          <button className="logo" onClick={reset} aria-label="Wrapped Therapy home">
            <span className="logo-disc" />
            <span>wrapped<em>therapy</em></span>
          </button>
          <div className="nav-right">
            <a className="nav-credit" href="https://instagram.com/dietcokecode" target="_blank" rel="noreferrer">@dietcokecode</a>
            {DEBUG && (
              <button className="nav-link" onClick={() => setTab(tab === 'lab' ? 'app' : 'lab')}>
                {tab === 'lab' ? 'back to app' : 'data lab'}
              </button>
            )}
            {step !== 'upload' && tab === 'app' && <button className="nav-cta" onClick={reset}>start over</button>}
          </div>
        </div>
      </header>

      <main key={tab + step} className="page">
        {tab === 'lab' ? (
          <DataLab />
        ) : (
          <>
            {step === 'upload' && (
              <Upload onFile={onFile} onManual={() => onManual()} />
            )}
            {step === 'scanning' && <Scanning preview={preview} progress={progress} />}
            {step === 'rejected' && rejection && (
              <Rejected
                rejection={rejection}
                preview={preview}
                onRetry={reset}
                onManual={() => onManual(rejection.partial, rejection.diag)}
              />
            )}
            {step === 'review' && data && (
              <Review data={data} diag={diag} preview={preview} city={city} onCity={setCity} onChange={setData} onDiagnose={onDiagnose} onBack={reset} />
            )}
            {step === 'result' && diagnosis && data && (
              <Result diagnosis={diagnosis} data={data} city={city} onRestart={reset} onEdit={() => { setStep('review'); top(); }} />
            )}
          </>
        )}
      </main>

      <footer className="wrap footer">
        <p className="helpline">
          <span>Actually not okay?</span> Talk to a real person. India: <b>Tele-MANAS 14416</b> (24×7, free) · US: <b>988</b> ·{' '}
          <a href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a>
        </p>
        <p className="fine">A parody. No playlists were diagnosed, some were judged.</p>
        <p className="fine">
          built by{' '}
          <a href="https://instagram.com/dietcokecode" target="_blank" rel="noreferrer">@dietcokecode</a>
          {' '}on instagram
        </p>
      </footer>
    </>
  );
}
