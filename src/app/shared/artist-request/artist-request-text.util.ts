export const MAX_ARTIST_REQUEST_TEASER_LENGTH = 20;
export const MAX_ARTIST_REQUEST_LONG_TEASER_LENGTH = 600;
export const MAX_ARTIST_REQUEST_DESCRIPTION_LENGTH = 600;

export function normalizeArtistRequestTeaser(text: string | null | undefined): string {
  return (text ?? '').trim().slice(0, MAX_ARTIST_REQUEST_TEASER_LENGTH);
}

export function normalizeArtistRequestLongTeaser(text: string | null | undefined): string {
  return (text ?? '').trim().slice(0, MAX_ARTIST_REQUEST_LONG_TEASER_LENGTH);
}

export function normalizeArtistRequestDescription(text: string | null | undefined): string {
  return (text ?? '').trim().slice(0, MAX_ARTIST_REQUEST_DESCRIPTION_LENGTH);
}