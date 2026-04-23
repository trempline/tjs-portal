import { Component, OnInit, inject } from '@angular/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistInstrumentOption,
  ArtistRequestMediaEntry,
  CreateStandaloneHostEventPayload,
  EventEditionOption,
  EventTypeOption,
  SupabaseService,
  TjsHost,
  TjsLocation,
} from '../../services/supabase.service';

interface ArtistOption {
  id: string;
  artist_name: string;
  profile_id: string;
  instruments: string[];
}

interface MediaDraftForm {
  media_type: 'CD' | 'Video';
  name: string;
  description: string;
  url: string;
  image_url: string | null;
}

interface ScheduleEntryForm {
  mode: 'day_show' | 'period';
  startDate: string;
  endDate: string;
  showTime: string;
  locationId: string | null;
}

@Component({
  selector: 'app-host-new-event',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './host-new-event.html',
})
export class HostNewEvent implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private location = inject(Location);

  isLoading = true;
  isSaving = false;
  isImageUploading = false;
  error = '';
  successMessage = '';
  activeTab: 'details' | 'artists' | 'instruments' | 'proposed-dates' | 'image' | 'media' = 'details';

  hosts: TjsHost[] = [];
  privateLocations: TjsLocation[] = [];
  publicLocations: TjsLocation[] = [];
  artists: ArtistOption[] = [];
  eventDomains: Array<{ id: number; name: string }> = [];
  editionOptions: EventEditionOption[] = [];
  eventTypeOptions: EventTypeOption[] = [];
  instrumentCatalog: ArtistInstrumentOption[] = [];
  selectedAdditionalInstrumentId: number | null = null;
  selectedArtistId = '';
  mediaDraft: MediaDraftForm = {
    media_type: 'Video',
    name: '',
    description: '',
    url: '',
    image_url: null,
  };
  isMediaImageUploading = false;

  form: CreateStandaloneHostEventPayload = {
    hostId: 0,
    title: '',
    eventDomainId: null,
    teaser: '',
    description: '',
    imageUrl: null,
    editionId: null,
    eventTypeId: null,
    entries: [],
    callToActionUrl: '',
    isPublished: true,
    isMemberOnly: false,
    artistIds: [],
    additionalInstruments: [],
    mediaEntries: [],
    notes: '',
  };

  scheduleEntries: ScheduleEntryForm[] = [{ mode: 'day_show', startDate: '', endDate: '', showTime: '', locationId: null }];

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';

    if (!profileId) {
      this.error = 'Event creation could not be loaded.';
      this.isLoading = false;
      return;
    }

    try {
      const [hosts, publicLocations, artists, eventDomains, editionOptions, eventTypeOptions, instrumentCatalog] = await Promise.all([
        this.supabase.getAccessibleHosts(profileId),
        this.supabase.getPublicLocations(),
        this.supabase.listTjsArtistsForRequestSelection(),
        this.supabase.listEventDomains(),
        this.supabase.listConcreteEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
        this.supabase.listArtistInstrumentOptions(),
      ]);

      this.hosts = hosts;
      this.publicLocations = publicLocations;
      this.artists = artists;
      this.eventDomains = eventDomains;
      this.editionOptions = editionOptions;
      this.eventTypeOptions = eventTypeOptions;
      this.instrumentCatalog = instrumentCatalog;
      this.form.hostId = hosts[0]?.id ?? 0;

      if (this.form.hostId) {
        await this.onHostChange();
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Event creation could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  setTab(tab: 'details' | 'artists' | 'instruments' | 'proposed-dates' | 'image' | 'media') {
    this.activeTab = tab;
  }

  async onHostChange() {
    this.privateLocations = this.form.hostId
      ? await this.supabase.getPrivateLocationsForHost(this.form.hostId)
      : [];

    this.scheduleEntries = this.scheduleEntries.map((entry) => ({
      ...entry,
      locationId: entry.locationId && this.allVenueOptions.some((location) => location.id === entry.locationId)
        ? entry.locationId
        : null,
    }));
  }

  get allVenueOptions(): TjsLocation[] {
    return [...this.privateLocations, ...this.publicLocations];
  }

  locationLabel(location: TjsLocation): string {
    return location.name || location.city || location.address || 'Unnamed location';
  }

  trackByHostId(_: number, item: TjsHost) {
    return item.id;
  }

  trackByLocationId(_: number, item: TjsLocation) {
    return item.id;
  }

  trackByArtistId(_: number, item: ArtistOption) {
    return item.id;
  }

  trackByNumericId(_: number, item: { id: number }) {
    return item.id;
  }

  trackByMedia(index: number, item: ArtistRequestMediaEntry) {
    return item.id ?? `${item.media_type}-${index}`;
  }

  trackByArtistName(_: number, item: string) {
    return item;
  }

  get selectedArtists(): ArtistOption[] {
    return this.artists.filter((artist) => this.form.artistIds.includes(artist.id));
  }

  addSelectedArtist() {
    if (!this.selectedArtistId || this.form.artistIds.includes(this.selectedArtistId)) {
      return;
    }

    this.form.artistIds = [...this.form.artistIds, this.selectedArtistId];
    this.selectedArtistId = '';
  }

  removeSelectedArtist(artistId: string) {
    this.form.artistIds = this.form.artistIds.filter((id) => id !== artistId);
  }

  addAdditionalInstrument() {
    const selected = this.instrumentCatalog.find((item) => item.id === this.selectedAdditionalInstrumentId) ?? null;
    if (!selected) {
      return;
    }

    if (!this.form.additionalInstruments.some((instrument) => instrument.toLowerCase() === selected.name.toLowerCase())) {
      this.form.additionalInstruments = [...this.form.additionalInstruments, selected.name];
    }

    this.selectedAdditionalInstrumentId = null;
  }

  removeAdditionalInstrument(index: number) {
    this.form.additionalInstruments = this.form.additionalInstruments.filter((_, currentIndex) => currentIndex !== index);
  }

  addMediaEntry() {
    if (!this.mediaDraft.name.trim() && !this.mediaDraft.url.trim() && !this.mediaDraft.image_url) {
      return;
    }

    this.form.mediaEntries = [
      ...this.form.mediaEntries,
      {
        media_type: this.mediaDraft.media_type,
        image_url: this.mediaDraft.image_url,
        name: this.mediaDraft.name.trim(),
        description: this.mediaDraft.description.trim(),
        url: this.mediaDraft.url.trim(),
      },
    ];
    this.mediaDraft = {
      media_type: 'Video',
      name: '',
      description: '',
      url: '',
      image_url: null,
    };
  }

  removeMediaEntry(index: number) {
    this.form.mediaEntries = this.form.mediaEntries.filter((_, currentIndex) => currentIndex !== index);
  }

  async onMediaImageSelected(event: Event, index: number) {
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!profileId || !file || !this.form.mediaEntries[index]) {
      return;
    }

    const uploadResult = await this.supabase.uploadArtistWorkspaceRequestImage(profileId, file, 'request-media');
    if (uploadResult.error || !uploadResult.url) {
      this.error = uploadResult.error ?? 'Media image upload failed.';
      input.value = '';
      return;
    }

    this.form.mediaEntries[index].image_url = uploadResult.url;
    input.value = '';
  }

  async onMediaDraftImageSelected(event: Event) {
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!profileId || !file) {
      return;
    }

    this.isMediaImageUploading = true;
    const uploadResult = await this.supabase.uploadArtistWorkspaceRequestImage(profileId, file, 'request-media');
    if (uploadResult.error || !uploadResult.url) {
      this.error = uploadResult.error ?? 'Media image upload failed.';
      this.isMediaImageUploading = false;
      input.value = '';
      return;
    }

    this.mediaDraft.image_url = uploadResult.url;
    this.isMediaImageUploading = false;
    input.value = '';
  }

  async onEventImageSelected(event: Event) {
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!profileId || !file) {
      return;
    }

    this.isImageUploading = true;
    const uploadResult = await this.supabase.uploadArtistWorkspaceRequestImage(profileId, file, 'request-image');
    if (uploadResult.error || !uploadResult.url) {
      this.error = uploadResult.error ?? 'Image upload failed.';
      this.isImageUploading = false;
      input.value = '';
      return;
    }

    this.form.imageUrl = uploadResult.url;
    this.isImageUploading = false;
    input.value = '';
  }

  addScheduleEntry() {
    this.scheduleEntries = [...this.scheduleEntries, { mode: 'day_show', startDate: '', endDate: '', showTime: '', locationId: null }];
  }

  removeScheduleEntry(index: number) {
    this.scheduleEntries = this.scheduleEntries.filter((_, currentIndex) => currentIndex !== index);
    if (this.scheduleEntries.length === 0) {
      this.scheduleEntries = [{ mode: 'day_show', startDate: '', endDate: '', showTime: '', locationId: null }];
    }
  }

  async createEvent() {
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    if (!profileId) {
      this.error = 'Event could not be created.';
      return;
    }

    if (!this.form.hostId) {
      this.error = 'Host is required.';
      return;
    }

    if (!this.form.title.trim()) {
      this.error = 'Event title is required.';
      return;
    }

    if (this.form.artistIds.length === 0) {
      this.error = 'At least one TJS artist is required.';
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
        locationLabel: this.resolveLocationLabel(entry.locationId),
      }));

    if (entries.length === 0) {
      this.error = 'At least one proposed date is required.';
      return;
    }

    for (const [index, entry] of entries.entries()) {
      if (entry.mode === 'period' && !entry.endDate) {
        this.error = `Schedule entry ${index + 1} requires an end date.`;
        return;
      }

      if (!entry.showTime) {
        this.error = `Schedule entry ${index + 1} requires a time.`;
        return;
      }

      if (!entry.locationId) {
        this.error = `Schedule entry ${index + 1} requires a location.`;
        return;
      }
    }

    const overlapError = this.findScheduleOverlap(entries);
    if (overlapError) {
      this.error = overlapError;
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const result = await this.supabase.createStandaloneHostEvent(profileId, {
      ...this.form,
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      callToActionUrl: this.form.callToActionUrl.trim(),
      notes: this.form.notes.trim(),
      entries,
    });

    if (result.error || !result.eventId) {
      this.error = result.error ?? 'Event could not be created.';
      this.isSaving = false;
      return;
    }

    this.successMessage = 'Event created.';
    this.isSaving = false;
    await this.router.navigate(['/backoffice/host-manager/events', result.eventId], { replaceUrl: true });
  }

  private findScheduleOverlap(entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string }>): string | null {
    const normalizedEntries = entries.map((entry, index) => {
      const start = entry.startDate;
      const end = entry.mode === 'period' ? entry.endDate : entry.startDate;
      return { index, start, end };
    });

    for (const entry of normalizedEntries) {
      if (entry.start > entry.end) {
        return `Schedule entry ${entry.index + 1} has an end date before its start date.`;
      }
    }

    for (let i = 0; i < normalizedEntries.length; i += 1) {
      for (let j = i + 1; j < normalizedEntries.length; j += 1) {
        const left = normalizedEntries[i];
        const right = normalizedEntries[j];
        if (left.start <= right.end && right.start <= left.end) {
          return `Schedule entries ${left.index + 1} and ${right.index + 1} overlap.`;
        }
      }
    }

    return null;
  }

  private resolveLocationLabel(locationId: string | null): string {
    if (!locationId) {
      return '';
    }

    const location = this.allVenueOptions.find((item) => item.id === locationId) ?? null;
    return location ? this.locationLabel(location) : '';
  }
}
