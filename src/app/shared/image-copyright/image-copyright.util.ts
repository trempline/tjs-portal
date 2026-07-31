export const MAX_COPYRIGHT_TEXT_LENGTH = 20;

/**
 * Stored copyright values hold the bare holder name — the leading "@" is a display
 * concern only, so typing "@Name" and "Name" both persist as "Name".
 */
export function normalizeCopyrightInput(text: string | null | undefined): string {
  return (text ?? '').replace(/^\s*@+/, '').trim().slice(0, MAX_COPYRIGHT_TEXT_LENGTH);
}

/** Shown on media that carries no named holder. */
export const COPYRIGHT_SYMBOL = '©';

/** Renders "@Holder" over the media, falling back to the © symbol when no holder is set. */
export function displayCopyrightText(text: string | null | undefined): string {
  const holder = normalizeCopyrightInput(text);
  return holder ? `@${holder}` : COPYRIGHT_SYMBOL;
}
