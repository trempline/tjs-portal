import { Location, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  EventEditionOption,
  EventTypeOption,
  HostPlusExternalEventItem,
  HostPlusExternalEventScheduleEntry,
  SupabaseService,
  TjsHost,
  TjsLocation,
} from '../../services/supabase.service';

interface HostPlusTjsEventForm {
  title: string;
  eventDomainId: number | null;
  eventDomainName: string;
  editionId: number | null;
  editionName: string;
  eventTypeId: number | null;
  eventTypeName: string;
  teaser: string;
  description: string;
  imageUrl: string | null;
  callToActionUrl: string;
  isPublished: boolean;
  isMemberOnly: boolean;
  notes: string;
}

interface HostPlusTjsEventScheduleForm {
  mode: 'day_show' | 'period';
  startDate: string;
  endDate: string;
  showTime: string;
  locationId: string | null;
  locationLabel: string;
}

@Component({
  selector: 'app-host-plus-create-tjs-event',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './host-plus-create-tjs-event.html',
})
export class HostPlusCreateTjsEvent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  hostId = 0;
  eventId = '';
  host: TjsHost | null = null;
  externalEvent: HostPlusExternalEventItem | null = null;
  sourceTable: 'events' | 'tjs_events' | null = null;
  databaseLabel = '';
  isMemberWorkspace = false;
  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  eventDomains: Array<{ id: number; name: string }> = [];
  editionOptions: EventEditionOption[] = [];
  eventTypeOptions: EventTypeOption[] = [];
  privateLocations: TjsLocation[] = [];
  publicLocations: TjsLocation[] = [];

  form: HostPlusTjsEventForm = this.blankForm();
  scheduleEntries: HostPlusTjsEventScheduleForm[] = [this.blankScheduleEntry()];

  async ngOnInit() {
    const routeEventId = this.route.snapshot.paramMap.get('eventId') ?? '';
    if (!routeEventId) {
      this.error = 'Event not found.';
      this.isLoading = false;
      return;
    }

    const routeHostId = await this.resolveHostId();
    if (!routeHostId) {
      this.isLoading = false;
      return;
    }

    this.hostId = routeHostId;
    this.eventId = routeEventId;
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    try {
      const [
        host,
        externalResult,
        eventDomains,
        editionOptions,
        eventTypeOptions,
        privateLocations,
        publicLocations,
      ] = await Promise.all([
        this.supabase.getHost(this.hostId),
        this.supabase.getHostPlusExternalEvents(this.hostId),
        this.supabase.listEventDomains(),
        this.supabase.listConcreteEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
        this.supabase.getPrivateLocationsForHost(this.hostId),
        this.supabase.getPublicLocations(),
      ]);

      this.host = host;
      this.sourceTable = externalResult.source_table;
      this.databaseLabel = externalResult.settings?.database_label
        || externalResult.settings?.supabase_url
        || 'Host+ database';
      this.eventDomains = eventDomains;
      this.editionOptions = editionOptions;
      this.eventTypeOptions = eventTypeOptions;
      this.privateLocations = privateLocations;
      this.publicLocations = publicLocations;
      this.externalEvent = externalResult.items.find((item) => item.id === this.eventId) ?? null;

      if (!host) {
        this.error = 'Host+ not found.';
        return;
      }

      if (!host.is_host_plus) {
        this.error = 'This host is not marked as Host+.';
        return;
      }

      if (externalResult.error) {
        this.error = externalResult.error;
        return;
      }

      if (!this.externalEvent || !this.sourceTable) {
        this.error = 'Event not found in the configured Host+ database.';
        return;
      }

      this.prefillForm(this.externalEvent);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'TJS event editor could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  get hostName(): string {
    return this.host?.public_name || this.host?.name || `Host+ #${this.hostId}`;
  }

  get allVenueOptions(): TjsLocation[] {
    return [...this.privateLocations, ...this.publicLocations];
  }

  locationLabel(location: TjsLocation): string {
    return location.name || location.city || location.address || 'Unnamed location';
  }

  trackByNumericId(_: number, item: { id: number }) {
    return item.id;
  }

  trackByLocationId(_: number, item: TjsLocation) {
    return item.id;
  }

  trackByScheduleIndex(index: number) {
    return index;
  }

  trackByExternalArtistId(_: number, item: HostPlusExternalEventItem['artists'][number]) {
    return item.id;
  }

  addScheduleEntry() {
    this.scheduleEntries = [...this.scheduleEntries, this.blankScheduleEntry()];
  }

  removeScheduleEntry(index: number) {
    this.scheduleEntries = this.scheduleEntries.filter((_, currentIndex) => currentIndex !== index);
    if (this.scheduleEntries.length === 0) {
      this.scheduleEntries = [this.blankScheduleEntry()];
    }
  }

  syncLocationLabel(index: number) {
    const entry = this.scheduleEntries[index];
    if (!entry?.locationId) {
      return;
    }

    const selectedLocation = this.allVenueOptions.find((location) => location.id === entry.locationId) ?? null;
    if (selectedLocation) {
      this.scheduleEntries[index] = {
        ...entry,
        locationLabel: this.locationLabel(selectedLocation),
      };
    }
  }

  async createEvent() {
    const profileId = this.authService.currentUser?.id ?? '';
    if (!profileId || !this.externalEvent || !this.sourceTable || this.isSaving) {
      this.error = 'Event could not be created.';
      return;
    }

    if (!this.form.title.trim()) {
      this.error = 'Event title is required.';
      return;
    }

    const entries = this.scheduleEntries
      .filter((entry) => !!entry.startDate)
      .map((entry) => ({
        mode: entry.mode,
        startDate: entry.startDate,
        endDate: entry.mode === 'period' ? entry.endDate : '',
        showTime: entry.showTime,
        locationId: entry.locationId,
        locationLabel: entry.locationLabel.trim(),
      }));

    if (entries.length === 0) {
      this.error = 'At least one event date is required.';
      return;
    }

    const scheduleError = this.validateSchedule(entries);
    if (scheduleError) {
      this.error = scheduleError;
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    const result = await this.supabase.createHostPlusTjsEvent(profileId, {
      hostId: this.hostId,
      externalEventId: this.externalEvent.id,
      externalSourceTable: this.sourceTable,
      externalDatabaseLabel: this.databaseLabel,
      title: this.form.title.trim(),
      eventDomainId: this.form.eventDomainId,
      eventDomainName: this.form.eventDomainName.trim() || null,
      editionId: this.form.editionId,
      editionName: this.form.editionName.trim() || null,
      eventTypeId: this.form.eventTypeId,
      eventTypeName: this.form.eventTypeName.trim() || null,
      teaser: this.form.teaser.trim(),
      description: this.form.description.trim(),
      imageUrl: this.form.imageUrl,
      callToActionUrl: this.form.callToActionUrl.trim(),
      isPublished: this.form.isPublished,
      isMemberOnly: this.form.isMemberOnly,
      externalArtists: this.externalEvent.artists.map((artist) => ({
        id: artist.id,
        displayName: artist.display_name,
        photoUrl: artist.photo_url,
        imageUrls: artist.image_urls,
      })),
      entries,
      notes: this.form.notes.trim(),
    });

    if (result.error || !result.eventId) {
      this.error = result.error ?? 'Event could not be created.';
      this.isSaving = false;
      return;
    }

    this.successMessage = 'TJS event created.';
    this.isSaving = false;
    await this.router.navigate(['/backoffice/host/events', result.eventId], { replaceUrl: true });
  }

  private prefillForm(event: HostPlusExternalEventItem) {
    this.form = {
      title: event.title || '',
      eventDomainId: this.matchNamedOption(this.eventDomains, event.event_domain_name),
      eventDomainName: event.event_domain_name ?? '',
      editionId: this.matchEditionOption(event.edition_name),
      editionName: event.edition_name ?? '',
      eventTypeId: this.matchNamedOption(this.eventTypeOptions, event.event_type_name),
      eventTypeName: event.event_type_name ?? '',
      teaser: event.teaser ?? '',
      description: event.description ?? event.teaser ?? '',
      imageUrl: event.photo_url,
      callToActionUrl: event.booking_url ?? '',
      isPublished: true,
      isMemberOnly: false,
      notes: '',
    };

    this.scheduleEntries = event.schedule_entries.length > 0
      ? event.schedule_entries.map((entry) => this.scheduleFormFromExternalEntry(entry))
      : [{
          ...this.blankScheduleEntry(),
          startDate: event.primary_date ?? '',
        }];
  }

  private scheduleFormFromExternalEntry(
    entry: HostPlusExternalEventScheduleEntry
  ): HostPlusTjsEventScheduleForm {
    const locationLabel = entry.location_name ?? '';
    const hasPeriod = !!entry.end_date && entry.end_date !== entry.start_date;

    return {
      mode: hasPeriod ? 'period' : 'day_show',
      startDate: entry.start_date ?? '',
      endDate: hasPeriod ? entry.end_date ?? '' : '',
      showTime: entry.time ?? '',
      locationId: this.matchLocationId(locationLabel),
      locationLabel,
    };
  }

  private matchNamedOption(options: Array<{ id: number; name: string }>, value: string | null): number | null {
    const normalizedValue = this.normalize(value);
    if (!normalizedValue) {
      return null;
    }

    return options.find((option) => this.normalize(option.name) === normalizedValue)?.id ?? null;
  }

  private matchEditionOption(value: string | null): number | null {
    const normalizedValue = this.normalize(value);
    if (!normalizedValue) {
      return null;
    }

    return this.editionOptions.find((option) => {
      const candidates = [option.name, option.label].map((item) => this.normalize(item));
      return candidates.some((candidate) =>
        candidate === normalizedValue
        || (!!candidate && (candidate.includes(normalizedValue) || normalizedValue.includes(candidate)))
      );
    })?.id ?? null;
  }

  private matchLocationId(value: string | null): string | null {
    const normalizedValue = this.normalize(value);
    if (!normalizedValue) {
      return null;
    }

    return this.allVenueOptions.find((location) => {
      const candidates = [
        location.name,
        this.locationLabel(location),
        location.city,
        location.address,
      ].map((item) => this.normalize(item));
      return candidates.some((candidate) => candidate === normalizedValue);
    })?.id ?? null;
  }

  private validateSchedule(
    entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string }>
  ): string | null {
    for (const [index, entry] of entries.entries()) {
      if (entry.mode === 'period' && !entry.endDate) {
        return `Schedule entry ${index + 1} requires an end date.`;
      }

      const endDate = entry.mode === 'period' ? entry.endDate : entry.startDate;
      if (entry.startDate > endDate) {
        return `Schedule entry ${index + 1} has an end date before its start date.`;
      }
    }

    return null;
  }

  private async resolveHostId(): Promise<number | null> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const routeHostId = Number(idParam);
      if (!Number.isFinite(routeHostId) || routeHostId <= 0) {
        this.error = 'Invalid Host+ id.';
        return null;
      }
      this.isMemberWorkspace = false;
      return routeHostId;
    }

    this.isMemberWorkspace = true;
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'TJS event editor could not be loaded.';
      return null;
    }

    const hosts = await this.supabase.getMyHosts(profileId);
    const host = hosts.find((item) => item.is_host_plus);
    if (!host) {
      this.error = 'No Host+ record is assigned to your account.';
      return null;
    }

    return host.id;
  }

  private blankForm(): HostPlusTjsEventForm {
    return {
      title: '',
      eventDomainId: null,
      eventDomainName: '',
      editionId: null,
      editionName: '',
      eventTypeId: null,
      eventTypeName: '',
      teaser: '',
      description: '',
      imageUrl: null,
      callToActionUrl: '',
      isPublished: true,
      isMemberOnly: false,
      notes: '',
    };
  }

  private blankScheduleEntry(): HostPlusTjsEventScheduleForm {
    return {
      mode: 'day_show',
      startDate: '',
      endDate: '',
      showTime: '',
      locationId: null,
      locationLabel: '',
    };
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
}
