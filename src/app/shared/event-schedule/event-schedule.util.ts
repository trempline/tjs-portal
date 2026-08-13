export type EventScheduleMode = 'day_show' | 'period';

/**
 * A schedule entry is either a single show date or a multi-day stay, which the workspace speaks
 * about as a concert and a residence.
 */
export function eventScheduleTypeLabel(mode: string | null | undefined): string {
  return mode === 'period' ? 'Residence' : 'Concert';
}

/** A residence runs across several days, so it carries no show time. */
export function eventScheduleHasTime(mode: string | null | undefined): boolean {
  return mode !== 'period';
}
