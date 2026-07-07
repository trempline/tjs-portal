export const DEFAULT_COPYRIGHT_TEXT = 'Copyright';
export const MAX_COPYRIGHT_TEXT_LENGTH = 20;

export function displayCopyrightText(text: string | null | undefined): string {
  const trimmed = text?.trim();
  return trimmed ? trimmed.slice(0, MAX_COPYRIGHT_TEXT_LENGTH) : DEFAULT_COPYRIGHT_TEXT;
}

export function normalizeCopyrightInput(text: string | null | undefined): string {
  return (text ?? '').trim().slice(0, MAX_COPYRIGHT_TEXT_LENGTH);
}