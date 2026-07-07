export const MAX_ARTIST_TAGLINE_LENGTH = 30;
export const MAX_ARTIST_SHORT_BIOGRAPHY_LENGTH = 300;
export const MAX_ARTIST_LONG_BIOGRAPHY_LENGTH = 600;

export function normalizeArtistTagline(text: string | null | undefined): string {
  return (text ?? '').trim().slice(0, MAX_ARTIST_TAGLINE_LENGTH);
}

export function normalizeArtistShortBiography(text: string | null | undefined): string {
  return (text ?? '').trim().slice(0, MAX_ARTIST_SHORT_BIOGRAPHY_LENGTH);
}

export function normalizeArtistLongBiography(text: string | null | undefined): string {
  return (text ?? '').trim().slice(0, MAX_ARTIST_LONG_BIOGRAPHY_LENGTH);
}

export function remainingCharacters(text: string | null | undefined, maxLength: number): number {
  return Math.max(0, maxLength - (text?.length ?? 0));
}