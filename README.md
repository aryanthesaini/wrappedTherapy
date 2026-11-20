# wrappedTherapy

A parody web app: upload your year-end music recap (Spotify Wrapped, YouTube Music Recap, Apple Music Replay, Amazon Music) and Dr. Playlist "diagnoses" you from your top artists, then suggests a (fictional) therapist who gets your kind of playlist.

> Not medical advice. Music taste can't diagnose anything. If you're struggling, talk to a real person: India Tele-MANAS **14416**, US **988**, or [findahelpline.com](https://findahelpline.com).

## How it works

1. **Read the screenshot, on-device.** Preflight checks (type, size, resolution, portrait shape), then [Tesseract.js](https://github.com/naptha/tesseract.js) OCR in the browser. Nothing is uploaded.
2. **Extract.** Finds "Top artists / Top songs" sections by position, pairs song titles with credit lines, fuzzy-matches against the artist + song catalogue, and rejects anything that isn't a recap.
3. **Score.** Each artist/song maps to genres; each genre carries points toward 11 conditions. Rank-weighted, with a mood-swing rule (lots of sad *and* hype listening ⇒ bipolar).
4. **Match.** Recommends therapists by specialty (seed data, fictional).

## Stack

Vite + React + TypeScript, plain CSS. No backend.

```bash
npm install
npm run dev      # http://localhost:5173  (add ?debug for parser details + data lab)
npm run build
```

## Data

- `src/data/artists.ts` core artists; `src/data/catalog/*.ts` artist + song catalogues (auto-loaded, Indian-heavy)
- `src/data/genres.ts` genre → condition weights
- `src/data/conditions.ts` conditions; `src/data/therapists.ts` fictional therapists
- `src/lib/engine.ts` scoring knobs (`TUNING`)
