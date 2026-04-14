import { Component, OnInit, inject } from '@angular/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistRequestCommentEntry,
  ArtistRequestDetail,
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
  imports: [NgIf, NgFor, FormsModule],
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
  error = '';
  successMessage = '';
  request: ArtistRequestDetail | null = null;
  hosts: TjsHost[] = [];
  editionOptions: EventEditionOption[] = [];
  eventTypeOptions: EventTypeOption[] = [];
  privateLocations: TjsLocation[] = [];
  publicLocations: TjsLocation[] = [];
  hostProposalEntries: HostProposalEntry[] = [];
  createdEventId: string | null = null;

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
    isOpenToMembers: false,
    notes: '',
  };

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    const requestId = this.route.snapshot.paramMap.get('id');
    const profileId = this.authService.currentUser?.id;

    if (!requestId || !profileId) {
      this.error = 'Event creation could not be loaded.';
      this.isLoading = false;
      return;
    }

    try {
      const [request, hosts, editionOptions, eventTypeOptions, privateLocations, publicLocations] = await Promise.all([
        this.supabase.getArtistWorkspaceRequestDetail(requestId),
        this.supabase.getMyHosts(profileId),
        this.supabase.listConcreteEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
        this.supabase.getPrivateLocations(profileId),
        this.supabase.getPublicLocations(),
      ]);

      this.request = request;
      this.hosts = hosts;
      this.editionOptions = editionOptions;
      this.eventTypeOptions = eventTypeOptions;
      this.privateLocations = privateLocations;
      this.publicLocations = publicLocations;

      if (!this.request) {
        this.error = 'Request details could not be loaded.';
        return;
      }

      this.hostProposalEntries = this.parseHostProposal(this.request.comments);
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

  async createEvent() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request?.id) {
      this.error = 'Event could not be created.';
      return;
    }

    if (!this.form.hostId) {
      this.error = 'Select a host before creating the event.';
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

    const result = await this.supabase.createHostEventFromRequest(this.request.id, profileId, this.form);
    if (result.error) {
      this.error = result.error;
      this.isSaving = false;
      return;
    }

    this.createdEventId = result.eventId;
    this.successMessage = 'Event created successfully.';
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
      isOpenToMembers: false,
      notes: '',
    };
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
}
