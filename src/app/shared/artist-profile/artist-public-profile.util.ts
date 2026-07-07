export interface PublicArtistProfileCompletenessInput {
  firstName?: string | null;
  lastName?: string | null;
  instruments: string[];
}

export function isPublicArtistProfileComplete(input: PublicArtistProfileCompletenessInput): boolean {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();

  if (!firstName || !lastName) {
    return false;
  }

  return input.instruments.some((instrument) => !!instrument.trim());
}