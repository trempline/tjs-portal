const ISO_DATE_PATTERN = /^\d{4}-\d{1,2}-\d{1,2}$/;

const frenchPublicDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: '2-digit',
});

export function formatFrenchPublicDate(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!ISO_DATE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return frenchPublicDateFormatter.format(date).replace(/\u00A0/g, ' ');
}

export function formatFrenchPublicDatePart(datePart: string): string {
  const trimmed = datePart.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.includes(' - ')) {
    const [start, end] = trimmed.split(' - ').map((part) => part.trim());
    const formattedStart = formatFrenchPublicDate(start);
    const formattedEnd = ISO_DATE_PATTERN.test(end) ? formatFrenchPublicDate(end) : end;
    return `${formattedStart} - ${formattedEnd}`;
  }

  return formatFrenchPublicDate(trimmed);
}

export function parsePublicScheduleLine(line: string): { datePart: string; timePart: string; locationPart: string } {
  const parts = line.split('|').map((part) => part.trim());
  const dateTimePart = parts[0] || '';
  const locationPart = parts[1] || '';
  const separatorIndex = dateTimePart.lastIndexOf(' : ');

  return {
    datePart: separatorIndex >= 0 ? dateTimePart.slice(0, separatorIndex).trim() : dateTimePart,
    timePart: separatorIndex >= 0 ? dateTimePart.slice(separatorIndex + 3).trim() : '',
    locationPart,
  };
}