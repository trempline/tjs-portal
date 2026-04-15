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
  activeTab: 'details' | 'instruments' | 'proposed-dates' | 'image' | 'media' | 'comments' = 'details';
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

  form: CreateHostEventFromRequestPayload = {
    hostId: 0,
    title: '',
    description: '',
    editionId: null,
    eventTypeId: null,
    startDate: '',
    endDate: null,
    showTime: '',
    locationId: null,
    isActive: true,
    isOpenToMembers: false,
    notes: '',
  };

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    const requestId = this.route.snapshot.paramMap.get('id');
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id;

    if (!requestId || !profileId) {
      this.error = 'Event creation could not be loaded.';
      this.isLoading = false;
      return;
    }

    try {
      const [request, hosts, eventDomains, editionOptions, eventTypeOptions, privateLocations, publicLocations, instrumentCatalog] = await Promise.all([
        this.supabase.getArtistWorkspaceRequestDetail(requestId),
        this.supabase.getMyHosts(profileId),
        this.supabase.listEventDomains(),
        this.supabase.listConcreteEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
        this.supabase.getPrivateLocations(profileId),
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

  setTab(tab: 'details' | 'instruments' | 'proposed-dates' | 'image' | 'media' | 'comments') {
    this.activeTab = tab;
  }

  locationLabel(location: TjsLocation): string {
    return location.name || location.city || location.address || 'Unnamed location';
  }

  trackByHostId(_: number, item: TjsHost) {
    return item.id;
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

  get selectedHostLabel(): string {
    const host = this.hosts.find((item) => item.id === this.form.hostId) ?? this.hosts[0] ?? null;
    return host?.name || host?.public_name || (host ? `Host #${host.id}` : 'No host linked');
  }

  get eventStatusLabel(): string {
    return this.form.isActive ? 'Active' : 'Inactive';
  }

  get isRequestPublished(): boolean {
    return this.request?.status === 'published';
  }

  get selectedDomainName(): string {
    if (!this.request?.event_domain_id) {
      return 'No domain';
    }

    return this.eventDomains.find((domain) => domain.id === this.request?.event_domain_id)?.name ?? 'No domain';
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

    if (!this.form.startDate) {
      this.error = 'Start date is required.';
      return;
    }

    if (!this.form.locationId) {
      this.error = 'Location is required.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const payload: CreateHostEventFromRequestPayload = {
      ...this.form,
      notes: this.buildEventNotes(),
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
  }

  private prefillForm() {
    if (!this.request) {
      return;
    }

    const firstProposal = this.hostProposalEntries[0] ?? null;
    this.form = {
      hostId: this.hosts[0]?.id ?? 0,
      title: this.request.event_title || '',
      description: this.request.description || this.request.long_teaser || this.request.teaser || '',
      editionId: this.matchEditionIdFromComments(this.request.comments),
      eventTypeId: this.matchEventTypeIdFromComments(this.request.comments),
      startDate: firstProposal?.startDate ?? '',
      endDate: firstProposal?.mode === 'period' ? (firstProposal.endDate || null) : null,
      showTime: firstProposal?.showTime ?? '',
      locationId: firstProposal?.locationId ?? null,
      isActive: true,
      isOpenToMembers: false,
      notes: '',
    };
  }

  private async loadInstruments() {
    const primaryProfileId = this.request?.artists.find((artist) => artist.profile_id)?.profile_id;
    if (!primaryProfileId) {
      this.instrumentOptions = [];
      return;
    }

    this.instrumentOptions = await this.supabase.getArtistWorkspaceInstruments(primaryProfileId);
  }

  private parseHostProposal(comments: ArtistRequestCommentEntry[]): HostProposalEntry[] {
    const hostAcceptedComment = [...comments]
      .reverse()
      .find((comment) => comment.body.startsWith('[HOST_ACCEPTED]'));

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
      .find((comment) => comment.body.startsWith('[HOST_ACCEPTED]'));

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
    const allLocations = [...this.privateLocations, ...this.publicLocations];
    return allLocations.find((location) => {
      const name = (location.name || '').trim().toLowerCase();
      const display = this.locationLabel(location).trim().toLowerCase();
      return name === normalized || display === normalized;
    })?.id ?? null;
  }

  private buildEventNotes(): string {
    const notes = [this.form.notes.trim()];

    if (this.request?.event_domain_id) {
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

    return notes.filter(Boolean).join('\n');
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
  }
}
