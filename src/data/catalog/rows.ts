import type { Region } from '../../types';

/**
 * [name, region, genreIds, aliases?]
 * genreIds must exist in src/data/genres.ts. Order genres most-defining first.
 */
export type ArtistRow = [name: string, region: Region, genres: string[], aliases?: string[]];

/**
 * [title, artists, genreOverride?]
 * artists: exact artist names; first = primary. Featured artists may follow.
 * genreOverride: set when the song's mood differs from the artist's usual genre
 * (e.g. a sad song by a party artist). Omit to inherit the primary artist's genres.
 */
export type SongRow = [title: string, artists: string[], genre?: string];
