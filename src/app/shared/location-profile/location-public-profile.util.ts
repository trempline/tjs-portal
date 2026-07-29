export interface LocationActivationInput {
  address?: string | null;
  lat?: number | null;
  long?: number | null;
}

function hasValidCoordinate(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateLocationForActivation(input: LocationActivationInput): string | null {
  if (!input.address?.trim()) {
    return 'Address is required before a location can be validated.';
  }

  if (!hasValidCoordinate(input.lat) || !hasValidCoordinate(input.long)) {
    return 'GPS coordinates (latitude and longitude) are required before a location can be validated.';
  }

  return null;
}

export function isPublicLocationComplete(input: LocationActivationInput): boolean {
  return validateLocationForActivation(input) === null;
}