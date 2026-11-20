import type { ArtistRow, SongRow } from './rows';

/**
 * Every catalogue file in this folder (bollywood.ts, punjabi.ts, …) exporting
 * ARTISTS and/or SONGS is picked up automatically. Add a file, it's included.
 */
type CatalogModule = { ARTISTS?: ArtistRow[]; SONGS?: SongRow[] };

const modules = import.meta.glob<CatalogModule>(['./*.ts', '!./index.ts', '!./rows.ts'], { eager: true });

export const CATALOG_FILES = Object.keys(modules).map((p) => p.replace(/^\.\/|\.ts$/g, ''));
export const CATALOG_ARTISTS: ArtistRow[] = Object.values(modules).flatMap((m) => m.ARTISTS ?? []);
export const CATALOG_SONGS: SongRow[] = Object.values(modules).flatMap((m) => m.SONGS ?? []);
