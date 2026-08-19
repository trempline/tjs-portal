import { ArtistRequestDateEntry } from '../../services/supabase.service';
import { eventScheduleHasTime } from '../event-schedule/event-schedule.util';

export interface HostProposedDateLike {
  mode: 'one_day' | 'period' | 'day_show';
  start_date?: string | null;
  end_date?: string | null;
  show_time?: string | null;
  location_id?: string | null;
}

export interface HostScheduleEntryLike {
  mode: 'one_day' | 'period' | 'day_show';
  startDate?: string | null;
  endDate?: string | null;
  showTime?: string | null;
  locationId?: string | null;
}

export function getCompleteArtistRequestDates(dates: ArtistRequestDateEntry[]): ArtistRequestDateEntry[] {
  return dates.filter((date) => {
    if (!date.start_date?.trim()) {
      return false;
    }

    if (date.request_type === 'period' && !date.end_date?.trim()) {
      return false;
    }

    return true;
  });
}

export function validateArtistRequestDates(dates: ArtistRequestDateEntry[]): string | null {
  if (getCompleteArtistRequestDates(dates).length === 0) {
    return 'At least one proposed date is required.';
  }

  return null;
}

export interface CompleteHostProposedDate {
  mode: 'one_day' | 'period';
  start_date: string;
  end_date: string;
  show_time: string;
  location_id: string;
}

export function getCompleteHostProposedDates(dates: HostProposedDateLike[]): CompleteHostProposedDate[] {
  return dates.flatMap((date) => {
    if (!date.start_date?.trim() || !date.location_id) {
      return [];
    }

    const mode = date.mode === 'period' ? 'period' : 'one_day';
    if (mode === 'period' && !date.end_date?.trim()) {
      return [];
    }

    // Only a concert runs at a given hour; a residence spans days and carries no time.
    const hasTime = eventScheduleHasTime(mode);
    if (hasTime && !date.show_time?.trim()) {
      return [];
    }

    return [{
      mode,
      start_date: date.start_date.trim(),
      end_date: date.end_date?.trim() ?? '',
      show_time: hasTime ? date.show_time!.trim() : '',
      location_id: date.location_id,
    }];
  });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParsedScheduleLine {
  mode: 'one_day' | 'period';
  dateLabel: string;
  showTime: string;
  locationLabel: string;
  /** Present on lines written since venues started carrying their id. */
  locationId: string | null;
}

/**
 * Builds a "Proposed Dates:" line. The venue id is appended so the venue survives the
 * round trip even when two venues share a name, or a venue has no name at all.
 */
export function buildScheduleLine(input: {
  mode: 'one_day' | 'period';
  dateLabel: string;
  showTime: string;
  locationLabel: string;
  locationId?: string | null;
}): string {
  const base = [
    input.mode === 'period' ? 'Period' : 'One Day',
    input.dateLabel,
    input.showTime,
    input.locationLabel,
  ];

  return (input.locationId ? [...base, input.locationId] : base).join(' | ');
}

/** Reads a schedule line written in either the old or the id-carrying format. */
export function parseScheduleLine(line: string): ParsedScheduleLine | null {
  const segments = line.split('|').map((item) => item.trim());
  if (segments.length < 4) {
    return null;
  }

  const lastSegment = segments[segments.length - 1];
  const carriesLocationId = segments.length >= 5 && UUID_PATTERN.test(lastSegment);
  const labelSegments = carriesLocationId ? segments.slice(3, -1) : segments.slice(3);

  return {
    mode: segments[0].toLowerCase() === 'period' ? 'period' : 'one_day',
    dateLabel: segments[1],
    showTime: segments[2],
    locationLabel: labelSegments.join(' | '),
    locationId: carriesLocationId ? lastSegment : null,
  };
}

export function validateHostProposedDates(dates: HostProposedDateLike[]): string | null {
  if (getCompleteHostProposedDates(dates).length === 0) {
    return 'At least one proposed date is required.';
  }

  return null;
}

export function validateHostScheduleEntries(entries: HostScheduleEntryLike[]): string | null {
  const completeEntries = entries.filter((entry) => !!entry.startDate?.trim());

  if (completeEntries.length === 0) {
    return 'At least one event date is required.';
  }

  for (const [index, entry] of completeEntries.entries()) {
    const mode = entry.mode === 'period' ? 'period' : 'one_day';

    if (mode === 'period' && !entry.endDate?.trim()) {
      return `Schedule entry ${index + 1} requires an end date.`;
    }

    // A residence spans days, so it is only a concert that needs a show time.
    if (eventScheduleHasTime(mode) && !entry.showTime?.trim()) {
      return `Schedule entry ${index + 1} requires a time.`;
    }

    if (!entry.locationId) {
      return `Schedule entry ${index + 1} requires a venue.`;
    }
  }

  return null;
}