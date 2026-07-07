import { ArtistRequestDateEntry } from '../../services/supabase.service';

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
    if (!date.start_date?.trim() || !date.show_time?.trim() || !date.location_id) {
      return [];
    }

    const mode = date.mode === 'period' ? 'period' : 'one_day';
    if (mode === 'period' && !date.end_date?.trim()) {
      return [];
    }

    return [{
      mode,
      start_date: date.start_date.trim(),
      end_date: date.end_date?.trim() ?? '',
      show_time: date.show_time.trim(),
      location_id: date.location_id,
    }];
  });
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

    if (!entry.showTime?.trim()) {
      return `Schedule entry ${index + 1} requires a time.`;
    }

    if (!entry.locationId) {
      return `Schedule entry ${index + 1} requires a venue.`;
    }
  }

  return null;
}