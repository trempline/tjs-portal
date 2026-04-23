import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, Location, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistInstrumentOption,
  ArtistRequestCommentEntry,
  ArtistRequestDateEntry,
  ArtistRequestDetail,
  ArtistRequestMediaEntry,
  CreateHostEventFromRequestPayload,
  EventEditionOption,
  EventTypeOption,
  HostVenueScheduleConflict,
  HostWorkspaceEventDetail,
  SupabaseService,
  TjsHost,
  TjsLocation,
} from '../../services/supabase.service';

interface HostProposalEntry {
  mode: 'one_day' | 'period';
  startDate: string;
  endDate: string;
  showTime: string;
  locationId: string | null;
  locationLabel: string;
}

interface HostCreateEventScheduleEntryForm {
  mode: 'day_show' | 'period';
  startDate: string;
  endDate: string;
  showTime: string;
  locationId: string | null;
}

interface NormalizedScheduleEntry {
  mode: 'day_show' | 'period';
  startDate: string;
  endDate: string;
  showTime: string;
  locationId: string | null;
}

@Component({
  selector: 'app-host-create-event',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe],
  templateUrl: './host-create-event.html',
})
export class HostCreateEvent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private location = inject(Location);

  isLoading = true;
  isSaving = false;
  isRequestImageUploading = false;
  error = '';
  successMessage = '';
  request: ArtistRequestDetail | null = null;
  hosts: TjsHost[] = [];
  activeTab: 'details' | 'artists' | 'instruments' | 'proposed-dates' | 'image' | 'media' | 'comments' = 'details';
  eventDomains: Array<{ id: number; name: string }> = [];
  editionOptions: EventEditionOption[] = [];
  eventTypeOptions: EventTypeOption[] = [];
  privateLocations: TjsLocation[] = [];
  publicLocations: TjsLocation[] = [];
  hostProposalEntries: HostProposalEntry[] = [];
  instrumentOptions: ArtistInstrumentOption[] = [];
  instrumentCatalog: ArtistInstrumentOption[] = [];
  selectedAdditionalInstrumentId: number | null = null;
  additionalInstruments: string[] = [];
  createdEventId: string | null = null;
  commentDraft = '';
  scheduleEntries: HostCreateEventScheduleEntryForm[] = [{ mode: 'day_show', startDate: '', endDate: '', showTime: '', locationId: null }];
  publishedEvent: HostWorkspaceEventDetail | null = null;
  showVenueConflictModal = false;
  venueConflicts: HostVenueScheduleConflict[] = [];
  pendingCreateEntries: NormalizedScheduleEntry[] | null = null;

  form: CreateHostEventFromRequestPayload = {
    hostId: 0,
    title: '',
    eventDomainId: null,
    teaser: '',
    longTeaser: '',
    description: '',
    editionId: null,
    eventTypeId: null,
    entries: [],
    showTime: '',
    callToActionUrl: '',
    locationId: null,
    isActive: true,
    isOpenToMembers: false,
    notes: '',
  };

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    const requestId = this.route.snapshot.paramMap.get('id');
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id;
    const requestedHostId = Number.parseInt(this.route.snapshot.queryParamMap.get('hostId') ?? '', 10);

    if (!requestId || !profileId) {
      this.error = 'Event creation could not be loaded.';
      this.isLoading = false;
      return;
    }

    try {
      const [request, hosts, eventDomains, editionOptions, eventTypeOptions, privateLocations, publicLocations, instrumentCatalog] = await Promise.all([
        this.supabase.getArtistWorkspaceRequestDetail(requestId),
        this.isAdmin ? this.supabase.getHosts() : this.supabase.getAccessibleHosts(profileId),
        this.supabase.listEventDomains(),
        this.supabase.listConcreteEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
        (this.isAdmin || this.authService.isHostManager) && !Number.isNaN(requestedHostId)
          ? this.supabase.getPrivateLocationsForHost(requestedHostId)
          : this.supabase.getPrivateLocations(profileId),
        this.supabase.getPublicLocations(),
        this.supabase.listArtistInstrumentOptions(),
      ]);

      this.request = request;
      this.hosts = hosts;
      this.eventDomains = eventDomains;
      this.editionOptions = editionOptions;
      this.eventTypeOptions = eventTypeOptions;
      this.privateLocations = privateLocations;
      this.publicLocations = publicLocations;
      this.instrumentCatalog = instrumentCatalog;

      if (!this.request) {
        this.error = 'Request details could not be loaded.';
        return;
      }

      this.hostProposalEntries = this.parseHostProposal(this.request.comments);
      await this.loadInstruments();
      this.prefillForm();
      if (this.isAdmin && !Number.isNaN(requestedHostId) && this.hosts.some((host) => host.id === requestedHostId)) {
        this.form.hostId = requestedHostId;
      }
      if (this.canChooseHost) {
        await this.onHostChange();
      }
      await this.loadPublishedEventSchedule(profileId);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Event creation could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  primaryArtistName(): string {
    return this.request?.artists.find((artist) => artist.is_primary)?.display_name
      || this.request?.artists[0]?.display_name
      || 'Unassigned';
  }

  setTab(tab: 'details' | 'artists' | 'instruments' | 'proposed-dates' | 'image' | 'media' | 'comments') {
    this.activeTab = tab;
  }

  locationLabel(location: TjsLocation): string {
    return location.name || location.city || location.address || 'Unnamed location';
  }

  get allVenueOptions(): TjsLocation[] {
    return [...this.privateLocations, ...this.publicLocations];
  }

  trackByHostId(_: number, item: TjsHost) {
    return item.id;
  }

  async onHostChange() {
    if (!this.canChooseHost) {
      return;
    }

    this.privateLocations = this.form.hostId
      ? await this.supabase.getPrivateLocationsForHost(this.form.hostId)
      : [];
  }

  trackByEditionId(_: number, item: EventEditionOption) {
    return item.id;
  }

  trackByEventTypeId(_: number, item: EventTypeOption) {
    return item.id;
  }

  trackByLocationId(_: number, item: TjsLocation) {
    return item.id;
  }

  trackByProposalIndex(index: number) {
    return index;
  }

  addScheduleEntry() {
    this.scheduleEntries = [
      ...this.scheduleEntries,
      { mode: 'day_show', startDate: '', endDate: '', showTime: '', locationId: null },
    ];
  }

  removeScheduleEntry(index: number) {
    this.scheduleEntries = this.scheduleEntries.filter((_, currentIndex) => currentIndex !== index);
    if (this.scheduleEntries.length === 0) {
      this.scheduleEntries = [{ mode: 'day_show', startDate: '', endDate: '', showTime: '', locationId: null }];
    }
  }

  trackByNumericId(_: number, item: { id: number }) {
    return item.id;
  }

  trackByInstrumentName(_: number, item: string) {
    return item;
  }

  trackByMedia(index: number, item: ArtistRequestMediaEntry) {
    return item.id ?? `${item.media_type}-${index}`;
  }

  trackByComment(index: number, item: ArtistRequestCommentEntry) {
    return item.id ?? index;
  }

  get sortedComments(): ArtistRequestCommentEntry[] {
    return [...(this.request?.comments ?? [])].reverse();
  }

  trackByArtist(index: number, item: NonNullable<ArtistRequestDetail['artists']>[number]) {
    return item.id ?? item.artist_id ?? item.invited_artist_id ?? item.profile_id ?? item.invited_email ?? index;
  }

  get selectedHostLabel(): string {
    const host = this.hosts.find((item) => item.id === this.form.hostId) ?? null;
    return host?.name || host?.public_name || (host ? `Host #${host.id}` : 'No host linked');
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get canChooseHost(): boolean {
    return this.isAdmin || this.authService.isHostManager;
  }

  get eventStatusLabel(): string {
    return this.form.isActive ? 'Active' : 'Inactive';
  }

  get isRequestPublished(): boolean {
    return this.request?.status === 'published';
  }

  get selectedDomainName(): string {
    if (!this.form.eventDomainId) {
      return 'No domain';
    }

    return this.eventDomains.find((domain) => domain.id === this.form.eventDomainId)?.name ?? 'No domain';
  }

  artistRequestedDateLabel(date: ArtistRequestDateEntry): string {
    if (date.request_type === 'period') {
      return `${date.start_date} to ${date.end_date || 'TBD'}${date.event_time ? ` | ${date.event_time}` : ''}`;
    }

    return `${date.start_date}${date.event_time ? ` | ${date.event_time}` : ''}`;
  }

  addAdditionalInstrument() {
    const selected = this.instrumentCatalog.find((instrument) => instrument.id === this.selectedAdditionalInstrumentId);
    if (!selected) {
      return;
    }

    if (!this.additionalInstruments.some((instrument) => instrument.toLowerCase() === selected.name.toLowerCase())) {
      this.additionalInstruments = [...this.additionalInstruments, selected.name];
    }

    this.selectedAdditionalInstrumentId = null;
  }

  removeAdditionalInstrument(index: number) {
    this.additionalInstruments = this.additionalInstruments.filter((_, currentIndex) => currentIndex !== index);
  }

  async onEventImageSelected(event: Event) {
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!profileId || !file || !this.request) {
      return;
    }

    this.isRequestImageUploading = true;
    const { url, error } = await this.supabase.uploadArtistWorkspaceRequestImage(profileId, file, 'request-image');
    if (error) {
      this.error = error;
    } else {
      this.request.image_url = url;
    }
    this.isRequestImageUploading = false;
    input.value = '';
  }

  async onMediaImageSelected(event: Event, index: number) {
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!profileId || !file || !this.request?.media[index]) {
      return;
    }

    const { url, error } = await this.supabase.uploadArtistWorkspaceRequestImage(profileId, file, 'request-media');
    if (error) {
      this.error = error;
    } else {
      this.request.media[index].image_url = url;
    }
    input.value = '';
  }

  async submitComment() {
    if (!this.request?.id || !this.commentDraft.trim() || !this.authService.currentUser?.id) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const error = await this.supabase.addArtistWorkspaceRequestComment(
      this.request.id,
      this.authService.currentUser.id,
      this.commentDraft,
    );

    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.commentDraft = '';
    await this.reloadRequest();
    this.successMessage = 'Comment added.';
    this.isSaving = false;
  }

  async createEvent() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request?.id || this.isRequestPublished) {
      this.error = 'Event could not be created.';
      return;
    }

    if (!this.form.hostId) {
      this.error = 'No host is linked to this workspace.';
      return;
    }

    if (!this.form.title.trim()) {
      this.error = 'Event title is required.';
      return;
    }

    if (!this.form.editionId) {
      this.error = 'Event edition is required.';
      return;
    }

    const entries: NormalizedScheduleEntry[] = this.scheduleEntries
      .filter((entry) => !!entry.startDate)
      .map((entry) => ({
        mode: entry.mode,
        startDate: entry.startDate,
        endDate: entry.mode === 'period' ? entry.endDate : '',
        showTime: entry.showTime,
        locationId: entry.locationId,
      }));

    if (entries.length === 0) {
      this.error = 'At least one event date is required.';
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
        this.error = `Schedule entry ${index + 1} requires a venue.`;
        return;
      }
    }

    const overlapError = this.findScheduleOverlap(entries);
    if (overlapError) {
      this.error = overlapError;
      return;
    }

    const venueConflicts = await this.supabase.getHostVenueScheduleConflicts(entries);
    if (venueConflicts.length > 0) {
      this.pendingCreateEntries = entries;
      this.venueConflicts = venueConflicts;
      this.showVenueConflictModal = true;
      return;
    }

    await this.submitEventCreation(entries);
  }

  cancelVenueConflictModal() {
    this.showVenueConflictModal = false;
    this.venueConflicts = [];
    this.pendingCreateEntries = null;
    this.error = 'Event creation was cancelled because of a venue date clash.';
  }

  async continueVenueConflictModal() {
    if (!this.pendingCreateEntries) {
      this.showVenueConflictModal = false;
      return;
    }

    const entries = this.pendingCreateEntries;
    this.showVenueConflictModal = false;
    this.venueConflicts = [];
    this.pendingCreateEntries = null;
    await this.submitEventCreation(entries);
  }

  trackByVenueConflict(_: number, item: HostVenueScheduleConflict) {
    return `${item.event_id}:${item.location_id}:${item.location_label}`;
  }

  private async submitEventCreation(entries: NormalizedScheduleEntry[]) {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request?.id || this.isRequestPublished) {
      this.error = 'Event could not be created.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const firstEntry = entries[0];
    const persistedLocationId = this.resolvePersistedLocationId(firstEntry.locationId);

    const payload: CreateHostEventFromRequestPayload = {
      ...this.form,
      callToActionUrl: this.form.callToActionUrl.trim(),
      entries: entries.map((entry) => ({
        mode: entry.mode,
        startDate: entry.startDate,
        endDate: entry.endDate,
      })),
      locationId: persistedLocationId,
      showTime: firstEntry.showTime,
      notes: this.buildEventNotes(entries),
    };

    const result = await this.supabase.createHostEventFromRequest(this.request.id, profileId, payload);
    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.createdEventId = result.eventId;
    this.request = {
      ...this.request,
      status: 'published',
    };
    this.successMessage = 'Event created and the request is now published.';
    this.isSaving = false;
    await this.router.navigate([
      this.isAdmin
        ? '/backoffice/events'
        : this.authService.isHostManager
          ? '/backoffice/host-manager/events'
          : '/backoffice/host/events',
      result.eventId,
    ], {
      replaceUrl: true,
    });
  }

  private prefillForm() {
    if (!this.request) {
      return;
    }

    const firstProposal = this.hostProposalEntries[0] ?? null;
    this.form = {
      hostId: this.hosts[0]?.id ?? 0,
      title: this.request.event_title || '',
      eventDomainId: this.request.event_domain_id,
      teaser: this.request.teaser || '',
      longTeaser: this.request.long_teaser || '',
      description: this.request.description || this.request.long_teaser || this.request.teaser || '',
      editionId: this.matchEditionIdFromComments(this.request.comments),
      eventTypeId: this.matchEventTypeIdFromComments(this.request.comments),
      entries: [],
      showTime: '',
      callToActionUrl: '',
      locationId: null,
      isActive: true,
      isOpenToMembers: false,
      notes: '',
    };
    this.scheduleEntries = this.hostProposalEntries.length > 0
      ? this.hostProposalEntries.map((entry) => ({
          mode: entry.mode === 'period' ? 'period' : 'day_show',
          startDate: entry.startDate,
          endDate: entry.mode === 'period' ? entry.endDate : '',
          showTime: entry.showTime,
          locationId: entry.locationId,
        }))
      : [{ mode: 'day_show', startDate: '', endDate: '', showTime: '', locationId: null }];
  }

  private async loadInstruments() {
    const profileIds = Array.from(
      new Set(
        (this.request?.artists ?? [])
          .map((artist) => artist.profile_id?.trim())
          .filter((profileId): profileId is string => !!profileId)
      )
    );

    if (profileIds.length === 0) {
      this.instrumentOptions = [];
      return;
    }

    const instrumentGroups = await Promise.all(
      profileIds.map((profileId) => this.supabase.getArtistWorkspaceInstruments(profileId))
    );

    const uniqueInstruments = new Map<number, ArtistInstrumentOption>();
    for (const group of instrumentGroups) {
      for (const instrument of group) {
        uniqueInstruments.set(instrument.id, instrument);
      }
    }

    this.instrumentOptions = Array.from(uniqueInstruments.values())
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private parseHostProposal(comments: ArtistRequestCommentEntry[]): HostProposalEntry[] {
    const hostAcceptedComment = [...comments]
      .reverse()
      .find((comment) => comment.body.startsWith('[HOST_PROPOSED]') || comment.body.startsWith('[HOST_ACCEPTED]'));

    if (!hostAcceptedComment) {
      return [];
    }

    const lines = hostAcceptedComment.body.split('\n').map((line) => line.trim()).filter(Boolean);
    const proposedDateIndex = lines.findIndex((line) => line === 'Proposed Dates:');
    if (proposedDateIndex < 0) {
      return [];
    }

    return lines
      .slice(proposedDateIndex + 1)
      .map((line) => line.replace(/^- /, '').trim())
      .filter(Boolean)
      .map((line) => this.parseProposalLine(line))
      .filter((item): item is HostProposalEntry => !!item);
  }

  private parseProposalLine(line: string): HostProposalEntry | null {
    const segments = line.split('|').map((item) => item.trim());
    if (segments.length < 4) {
      return null;
    }

    const mode = segments[0].toLowerCase() === 'period' ? 'period' : 'one_day';
    const dateLabel = segments[1];
    const showTime = segments[2];
    const locationLabel = segments.slice(3).join(' | ');
    const locationId = this.findLocationIdByLabel(locationLabel);

    if (mode === 'period') {
      const [startDate, endDate] = dateLabel.split(' to ').map((item) => item.trim());
      return {
        mode,
        startDate: startDate || '',
        endDate: endDate && endDate !== 'TBD' ? endDate : '',
        showTime,
        locationId,
        locationLabel,
      };
    }

    return {
      mode,
      startDate: dateLabel,
      endDate: '',
      showTime,
      locationId,
      locationLabel,
    };
  }

  private matchEditionIdFromComments(comments: ArtistRequestCommentEntry[]): number | null {
    const editionName = this.readTaggedCommentValue(comments, 'Edition:');
    return this.editionOptions.find((item) =>
      item.name === editionName || item.label === editionName
    )?.id ?? null;
  }

  private matchEventTypeIdFromComments(comments: ArtistRequestCommentEntry[]): number | null {
    const eventTypeName = this.readTaggedCommentValue(comments, 'Event Type:');
    return this.eventTypeOptions.find((item) => item.name === eventTypeName)?.id ?? null;
  }

  private readTaggedCommentValue(comments: ArtistRequestCommentEntry[], prefix: string): string | null {
    const hostAcceptedComment = [...comments]
      .reverse()
      .find((comment) => comment.body.startsWith('[HOST_PROPOSED]') || comment.body.startsWith('[HOST_ACCEPTED]'));

    if (!hostAcceptedComment) {
      return null;
    }

    return hostAcceptedComment.body
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith(prefix))
      ?.replace(prefix, '')
      .trim() ?? null;
  }

  private findLocationIdByLabel(label: string): string | null {
    const normalized = label.trim().toLowerCase();
    return this.allVenueOptions.find((location) => {
      const name = (location.name || '').trim().toLowerCase();
      const display = this.locationLabel(location).trim().toLowerCase();
      return name === normalized || display === normalized;
    })?.id ?? null;
  }

  private buildEventNotes(entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string; showTime: string; locationId: string | null }>): string {
    const notes = [this.form.notes.trim()];

    if (this.form.eventDomainId) {
      notes.push(`Event Domain: ${this.selectedDomainName}`);
    }

    if (this.request?.image_url) {
      notes.push(`Event Image: ${this.request.image_url}`);
    }

    if (this.additionalInstruments.length > 0) {
      notes.push(`Additional Instruments: ${this.additionalInstruments.join(', ')}`);
    }

    const mediaLines = (this.request?.media ?? [])
      .filter((item) => item.name.trim() || item.url?.trim() || item.image_url)
      .map((item) => {
        const parts = [
          item.media_type,
          item.name.trim() || 'Untitled media',
          item.url?.trim() || 'No link',
          item.image_url || 'No image',
        ];
        return `- ${parts.join(' | ')}`;
      });

    if (mediaLines.length > 0) {
      notes.push('Media:');
      notes.push(...mediaLines);
    }

    if (entries.length > 0) {
      notes.push('Event Schedule:');
      notes.push(...entries.map((entry) => {
        const venueLabel = this.resolveScheduleEntryLocationLabel(entry.locationId) || 'No venue';
        const dateLabel = entry.mode === 'period'
          ? `${entry.startDate} to ${entry.endDate || 'TBD'}`
          : entry.startDate;

        return `- ${entry.mode === 'period' ? 'Period' : 'Day Show'} | ${dateLabel} | ${entry.showTime || 'No time'} | ${venueLabel}`;
      }));
    }

    return notes.filter(Boolean).join('\n');
  }

  private resolveScheduleEntryLocationLabel(locationId: string | null): string | null {
    if (!locationId) {
      return null;
    }

    const selectedLocation = this.allVenueOptions
      .find((location) => location.id === locationId);

    return selectedLocation ? this.locationLabel(selectedLocation) : null;
  }

  private resolvePersistedLocationId(locationId: string | null): string | null {
    if (!locationId) {
      return null;
    }

    return this.publicLocations.some((location) => location.id === locationId) ? locationId : null;
  }

  private findScheduleOverlap(
    entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string }>,
  ): string | null {
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
        const overlaps = left.start <= right.end && right.start <= left.end;

        if (overlaps) {
          return `Schedule entries ${left.index + 1} and ${right.index + 1} overlap.`;
        }
      }
    }

    return null;
  }

  private buildVenueConflictPrompt(conflicts: HostVenueScheduleConflict[]): string {
    const lines = [
      'There is a clash of events on the same date and location.',
      'Press OK to save anyway, or Cancel to review the schedule.',
      '',
    ];

    for (const conflict of conflicts) {
      lines.push(`${conflict.location_label} | ${conflict.event_title} (${conflict.event_status})`);
      lines.push(...conflict.conflicting_schedule_lines.map((line) => `- ${line}`));
      lines.push('');
    }

    return lines.join('\n').trim();
  }

  private async reloadRequest() {
    if (!this.request?.id) {
      return;
    }

    const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(this.request.id);
    if (!refreshed) {
      return;
    }

    this.request = refreshed;
    this.hostProposalEntries = this.parseHostProposal(refreshed.comments);
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id;
    if (profileId) {
      await this.loadPublishedEventSchedule(profileId);
    }
  }

  private async loadPublishedEventSchedule(profileId: string) {
    this.publishedEvent = null;

    if (!this.request || this.request.status !== 'published') {
      return;
    }

    const eventCreatedComment = [...this.request.comments]
      .reverse()
      .find((comment) => comment.body.startsWith('[EVENT_CREATED]'));

    const eventId = eventCreatedComment?.body
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('Event ID:'))
      ?.replace('Event ID:', '')
      .trim();

    if (!eventId) {
      return;
    }

    this.publishedEvent = this.isAdmin
      ? await this.supabase.getAdminWorkspaceEventDetail(eventId)
      : await this.supabase.getHostWorkspaceEventDetail(profileId, eventId);
    if (!this.publishedEvent) {
      return;
    }

    this.scheduleEntries = (this.publishedEvent.schedule_entries ?? []).length > 0
      ? (this.publishedEvent.schedule_entries ?? []).map((entry) => ({
          mode: entry.mode,
          startDate: entry.start_date,
          endDate: entry.end_date,
          showTime: this.publishedEvent?.show_time ?? '',
          locationId: this.resolveLocationSelection(this.publishedEvent?.location_id ?? null, this.publishedEvent?.location_name ?? null),
        }))
      : this.scheduleEntries;
  }

  private resolveLocationSelection(locationId: string | null, locationName: string | null): string | null {
    if (locationId) {
      return locationId;
    }

    const normalizedLabel = locationName?.trim().toLowerCase();
    if (!normalizedLabel) {
      return null;
    }

    return this.allVenueOptions.find((location) =>
      this.locationLabel(location).trim().toLowerCase() === normalizedLabel
    )?.id ?? null;
  }
}
