const PLACEHOLDER_VALUES = new Set(['-', 'n/a', 'na', 'tba', 'null', 'undefined', 'none', '#']);

export function hasPublicBookingUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) {
    return false;
  }

  if (!/^https?:\/\/.+/i.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export function normalizePublicBookingUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  return hasPublicBookingUrl(trimmed) ? trimmed! : null;
}