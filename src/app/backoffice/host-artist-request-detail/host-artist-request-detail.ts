import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, Location, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArtistInstrumentOption,
  ArtistRequestDateEntry,
  ArtistRequestDetail,
  EventEditionOption,
  EventTypeOption,
  SupabaseService,
  TjsLocation,
} from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

interface HostProposedDateEntry {
  mode: 'one_day' | 'period';
  start_date: string;
  end_date: string;
  show_time: string;
  location_id: string | null;
}

@Component({
  selector: 'app-host-artist-request-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, FormsModule],
  templateUrl: './host-artist-request-detail.html',
})
export class HostArtistRequestDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private location = inject(Location);
  private authService = inject(AuthService);

  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';
  request: ArtistRequestDetail | null = null;
  activeTab: 'request' | 'instruments' | 'comments' = 'request';
  instrumentOptions: ArtistInstrumentOption[] = [];
  editionOptions: EventEditionOption[] = [];
  eventTypeOptions: EventTypeOption[] = [];
  privateLocations: TjsLocation[] = [];
  publicLocations: TjsLocation[] = [];
  commentDraft = '';
  selectedEditionId: number | null = null;
  selectedEventTypeId: number | null = null;
  proposedDates: HostProposedDateEntry[] = [this.createBlankProposedDate()];
  proposalDraftDates: HostProposedDateEntry[] = [];
  draftSelectedEditionId: number | null = null;
  draftSelectedEventTypeId: number | null = null;
  acceptedByHost = false;
  isProposalModalOpen = false;

  async ngOnInit() {
    const requestId = this.route.snapshot.paramMap.get('id');
    if (!requestId) {
      this.error = 'Request not found.';
      this.isLoading = false;
      return;
    }

    try {
      const [request, editionOptions, eventTypeOptions] = await Promise.all([
        this.supabase.getArtistWorkspaceRequestDetail(requestId),
        this.supabase.listEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
      ]);

      this.request = request;
      this.editionOptions = editionOptions;
      this.eventTypeOptions = eventTypeOptions;

      if (!this.request) {
        this.error = 'Request details could not be loaded.';
        return;
      }

      this.acceptedByHost = this.isHostAcceptedWorkflow(this.request.status);
      await Promise.all([this.loadInstruments(), this.loadLocations()]);
      this.hydrateArtistProposalFromComments();
      this.hydrateHostProposalFromComments();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Request details could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  setTab(tab: 'request' | 'instruments' | 'comments') {
    this.activeTab = tab;
  }

  primaryArtistName(): string {
    return this.request?.artists.find((artist) => artist.is_primary)?.display_name
      || this.request?.artists[0]?.display_name
      || 'Unassigned';
  }

  addProposedDate() {
    this.proposedDates = [...this.proposedDates, this.createBlankProposedDate()];
  }

  addDraftProposedDate() {
    this.proposalDraftDates = [...this.proposalDraftDates, this.createBlankProposedDate()];
  }

  removeProposedDate(index: number) {
    this.proposedDates = this.proposedDates.filter((_, currentIndex) => currentIndex !== index);
    if (this.proposedDates.length === 0) {
      this.proposedDates = [this.createBlankProposedDate()];
    }
  }

  removeDraftProposedDate(index: number) {
    this.proposalDraftDates = this.proposalDraftDates.filter((_, currentIndex) => currentIndex !== index);
    if (this.proposalDraftDates.length === 0) {
      this.proposalDraftDates = [this.createBlankProposedDate()];
    }
  }

  openProposalModal() {
    if (this.hasSubmittedHostProposal) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.draftSelectedEditionId = this.selectedEditionId;
    this.draftSelectedEventTypeId = this.selectedEventTypeId;
    this.proposalDraftDates = this.cloneProposalDates(this.proposedDates);
    this.isProposalModalOpen = true;
  }

  closeProposalModal() {
    this.isProposalModalOpen = false;
    this.proposalDraftDates = [];
    this.draftSelectedEditionId = null;
    this.draftSelectedEventTypeId = null;
  }

  async saveProposalDraft() {
    if (!this.request?.id || !this.authService.currentUser?.id) {
      return;
    }

    const validProposals = this.proposalDraftDates.filter((item) => {
      if (!item.start_date || !item.show_time || !item.location_id) {
        return false;
      }

      return item.mode === 'one_day' || !!item.end_date;
    });

    if (validProposals.length === 0) {
      this.error = 'Add at least one proposed date before saving.';
      return;
    }

    if (!this.draftSelectedEditionId || !this.draftSelectedEventTypeId) {
      this.error = 'Select both event edition and event type before saving.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const selectedEdition = this.editionOptions.find((item) => item.id === this.draftSelectedEditionId)?.name ?? `Edition #${this.draftSelectedEditionId}`;
    const selectedEventType = this.eventTypeOptions.find((item) => item.id === this.draftSelectedEventTypeId)?.name ?? `Type #${this.draftSelectedEventTypeId}`;
    const proposalSummary = validProposals.map((item) => {
      const selectedLocation = this.findLocationById(item.location_id);
      const locationName = selectedLocation?.name || 'Unknown location';
      const datePart = item.mode === 'period'
        ? `${item.start_date} to ${item.end_date}`
        : item.start_date;

      return `${item.mode === 'period' ? 'Period' : 'One Day'} | ${datePart} | ${item.show_time} | ${locationName}`;
    });

    const commentError = await this.supabase.addArtistWorkspaceRequestComment(
      this.request.id,
      this.authService.currentUser.id,
      [
        '[HOST_PROPOSED]',
        `Edition: ${selectedEdition}`,
        `Event Type: ${selectedEventType}`,
        'Proposed Dates:',
        ...proposalSummary.map((line) => `- ${line}`),
      ].join('\n'),
    );

    if (commentError) {
      this.error = commentError;
      this.isSaving = false;
      return;
    }

    this.selectedEditionId = this.draftSelectedEditionId;
    this.selectedEventTypeId = this.draftSelectedEventTypeId;
    this.proposedDates = this.cloneProposalDates(validProposals);
    this.closeProposalModal();
    this.successMessage = 'New proposed dates sent to the artist.';
    await this.reloadRequest();
    this.isSaving = false;
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
    this.successMessage = 'Comment added.';
    await this.reloadRequest();
    this.isSaving = false;
  }

  async acceptRequest() {
    if (!this.request?.id || !this.authService.currentUser?.id) {
      return;
    }

    const validProposals = this.proposedDates.filter((item) => {
      if (!item.start_date || !item.show_time || !item.location_id) {
        return false;
      }

      return item.mode === 'one_day' || !!item.end_date;
    });

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    let commentBody: string | null = null;

    if (validProposals.length > 0) {
      if (!this.selectedEditionId || !this.selectedEventTypeId) {
        this.error = 'Select both event edition and event type before accepting.';
        this.isSaving = false;
        return;
      }

      const selectedEdition = this.editionOptions.find((item) => item.id === this.selectedEditionId)?.name ?? `Edition #${this.selectedEditionId}`;
      const selectedEventType = this.eventTypeOptions.find((item) => item.id === this.selectedEventTypeId)?.name ?? `Type #${this.selectedEventTypeId}`;
      const proposalSummary = validProposals.map((item) => {
        const selectedLocation = this.findLocationById(item.location_id);
        const locationName = selectedLocation?.name || 'Unknown location';
        const datePart = item.mode === 'period'
          ? `${item.start_date} to ${item.end_date}`
          : item.start_date;

        return `${item.mode === 'period' ? 'Period' : 'One Day'} | ${datePart} | ${item.show_time} | ${locationName}`;
      });
      const acceptanceLines = [
        '[HOST_PROPOSED]',
        `Edition: ${selectedEdition}`,
        `Event Type: ${selectedEventType}`,
        'Proposed Dates:',
        ...proposalSummary.map((line) => `- ${line}`),
      ];
      commentBody = acceptanceLines.join('\n');
    } else {
      commentBody = '[HOST_ACCEPTED]\nHost accepted the artist request without proposing new dates.';
    }

    const commentError = await this.supabase.addArtistWorkspaceRequestComment(
      this.request.id,
      this.authService.currentUser.id,
      commentBody,
    );

    if (commentError) {
      this.error = commentError;
      this.isSaving = false;
      return;
    }

    this.acceptedByHost = true;
    this.successMessage = 'Request accepted by host.';
    await this.reloadRequest();
    this.isSaving = false;
  }

  trackByOptionalId(_: number, item: { id?: string }) {
    return item.id ?? _;
  }

  trackByNumericId(_: number, item: { id: number }) {
    return item.id;
  }

  trackByLocationId(_: number, item: TjsLocation) {
    return item.id;
  }

  locationLabel(location: TjsLocation): string {
    return location.name || location.city || location.address || 'Unnamed location';
  }

  artistRequestedDateLabel(date: ArtistRequestDateEntry): string {
    if (date.request_type === 'period') {
      return `${date.start_date} to ${date.end_date || 'TBD'}${date.event_time ? ` | ${date.event_time}` : ''}`;
    }

    return `${date.start_date}${date.event_time ? ` | ${date.event_time}` : ''}`;
  }

  requestStatusLabel(status: string): string {
    switch (status) {
      case 'new_request':
        return 'New Request';
      case 'accepted_by_host':
        return 'Accepted by Host';
      case 'host_proposed':
        return 'Host Proposed';
      case 'artist_proposed':
        return 'Artist Proposed';
      case 'artist_accepted':
        return 'Artist Accepted';
      case 'approved':
        return 'Approved';
      case 'published':
        return 'Published';
      default:
        return status;
    }
  }

  get canCreateEvent(): boolean {
    return ['accepted_by_host', 'artist_accepted', 'approved'].includes(this.request?.status ?? '');
  }

  get hasSubmittedHostProposal(): boolean {
    return this.request?.status === 'accepted_by_host'
      || this.request?.status === 'host_proposed'
      || this.request?.status === 'artist_accepted'
      || this.request?.status === 'approved'
      || this.request?.status === 'published';
  }

  get recentComments() {
    return (this.request?.comments ?? []).slice(-3).reverse();
  }

  get sortedComments() {
    return [...(this.request?.comments ?? [])].reverse();
  }

  async openCreateEvent() {
    if (!this.request?.id) {
      return;
    }

    await this.router.navigate(['/backoffice/host/requests', this.request.id, 'create-event']);
  }

  private async loadInstruments() {
    const primaryProfileId = this.request?.artists.find((artist) => artist.profile_id)?.profile_id;
    if (!primaryProfileId) {
      this.instrumentOptions = [];
      return;
    }

    this.instrumentOptions = await this.supabase.getArtistWorkspaceInstruments(primaryProfileId);
  }

  private async loadLocations() {
    const currentUserId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id;
    const [privateLocations, publicLocations] = await Promise.all([
      this.supabase.getPrivateLocations(currentUserId),
      this.supabase.getPublicLocations(),
    ]);

    this.privateLocations = privateLocations;
    this.publicLocations = publicLocations;
  }

  private createBlankProposedDate(): HostProposedDateEntry {
    return {
      mode: 'one_day',
      start_date: '',
      end_date: '',
      show_time: '',
      location_id: null,
    };
  }

  private findLocationById(locationId: string | null): TjsLocation | null {
    if (!locationId) {
      return null;
    }

    return this.privateLocations.find((location) => location.id === locationId)
      || this.publicLocations.find((location) => location.id === locationId)
      || null;
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
    this.acceptedByHost = this.isHostAcceptedWorkflow(this.request.status);
    this.hydrateArtistProposalFromComments();
    this.hydrateHostProposalFromComments();
  }

  private cloneProposalDates(source: HostProposedDateEntry[]): HostProposedDateEntry[] {
    if (source.length === 0) {
      return [this.createBlankProposedDate()];
    }

    return source.map((item) => ({
      mode: item.mode,
      start_date: item.start_date,
      end_date: item.end_date,
      show_time: item.show_time,
      location_id: item.location_id,
    }));
  }

  private isHostAcceptedWorkflow(status: string): boolean {
    return ['accepted_by_host', 'host_proposed', 'artist_accepted', 'approved', 'published'].includes(status);
  }

  private hydrateHostProposalFromComments() {
    const hostAcceptedComment = this.request?.comments
      ? [...this.request.comments].reverse().find((comment) => comment.body.startsWith('[HOST_PROPOSED]') || comment.body.startsWith('[HOST_ACCEPTED]'))
      : null;

    if (!hostAcceptedComment) {
      return;
    }

    const lines = hostAcceptedComment.body.split('\n').map((line) => line.trim()).filter(Boolean);
    const editionLine = lines.find((line) => line.startsWith('Edition:'));
    const eventTypeLine = lines.find((line) => line.startsWith('Event Type:'));
    const proposedDateIndex = lines.findIndex((line) => line === 'Proposed Dates:');

    const editionName = editionLine ? editionLine.replace('Edition:', '').trim() : '';
    const eventTypeName = eventTypeLine ? eventTypeLine.replace('Event Type:', '').trim() : '';
    this.selectedEditionId = this.editionOptions.find((item) => item.name === editionName)?.id ?? this.selectedEditionId;
    this.selectedEventTypeId = this.eventTypeOptions.find((item) => item.name === eventTypeName)?.id ?? this.selectedEventTypeId;

    const parsedDates = proposedDateIndex >= 0
      ? lines
        .slice(proposedDateIndex + 1)
        .map((line) => line.replace(/^- /, '').trim())
        .filter(Boolean)
        .map((line) => this.parseHostProposalLine(line))
        .filter((item): item is HostProposedDateEntry => !!item)
      : [];

    if (parsedDates.length > 0) {
      this.proposedDates = parsedDates;
    }
  }

  private hydrateArtistProposalFromComments() {
    if (!this.request || this.request.status !== 'artist_proposed') {
      return;
    }

    const artistProposedComment = [...this.request.comments]
      .reverse()
      .find((comment) => comment.body.startsWith('[ARTIST_PROPOSED]'));

    if (!artistProposedComment) {
      return;
    }

    const lines = artistProposedComment.body.split('\n').map((line) => line.trim()).filter(Boolean);
    const parsedDates = lines
      .slice(1)
      .map((line) => line.replace(/^- /, '').trim())
      .filter((line) => line && line !== 'Artist proposed new dates:')
      .map((line) => this.parseArtistProposalLine(line))
      .filter((item): item is ArtistRequestDateEntry => !!item);

    if (parsedDates.length > 0) {
      this.request = {
        ...this.request,
        dates: parsedDates,
      };
    }
  }

  private parseArtistProposalLine(line: string): ArtistRequestDateEntry | null {
    const segments = line.split('|').map((item) => item.trim());
    if (segments.length < 2) {
      return null;
    }

    const modeLabel = segments[0].toLowerCase();
    const dateLabel = segments[1];
    const eventTime = segments[2] ?? '';

    if (modeLabel === 'period') {
      const [startDate, endDate] = dateLabel.split(' to ').map((item) => item.trim());
      if (!startDate) {
        return null;
      }

      return {
        request_type: 'period',
        start_date: startDate,
        end_date: endDate && endDate !== 'TBD' ? endDate : '',
        event_time: eventTime,
      };
    }

    if (modeLabel !== 'one day') {
      return null;
    }

    return {
      request_type: 'day_show',
      start_date: dateLabel,
      end_date: '',
      event_time: eventTime,
    };
  }

  private parseHostProposalLine(line: string): HostProposedDateEntry | null {
    const segments = line.split('|').map((item) => item.trim());
    if (segments.length < 4) {
      return null;
    }

    const modeLabel = segments[0];
    const dateLabel = segments[1];
    const showTime = segments[2];
    const locationName = segments.slice(3).join(' | ');
    const mode = modeLabel.toLowerCase() === 'period' ? 'period' : 'one_day';

    if (mode === 'period') {
      const [startDate, endDate] = dateLabel.split(' to ').map((item) => item.trim());
      return {
        mode,
        start_date: startDate || '',
        end_date: endDate && endDate !== 'TBD' ? endDate : '',
        show_time: showTime,
        location_id: this.findLocationIdByLabel(locationName),
      };
    }

    return {
      mode,
      start_date: dateLabel,
      end_date: '',
      show_time: showTime,
      location_id: this.findLocationIdByLabel(locationName),
    };
  }

  private findLocationIdByLabel(locationName: string): string | null {
    const normalizedLocationName = locationName.trim().toLowerCase();
    const matchedLocation = [...this.privateLocations, ...this.publicLocations].find((location) => {
      const label = this.locationLabel(location).trim().toLowerCase();
      const name = (location.name || '').trim().toLowerCase();
      return label === normalizedLocationName || name === normalizedLocationName;
    });

    return matchedLocation?.id ?? null;
  }
}
