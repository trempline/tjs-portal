import { DatePipe, Location, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistRequestCommentEntry,
  EventEditionOption,
  EventTypeOption,
  HostWorkspaceEventDetail,
  SupabaseService,
  TjsLocation,
  UpdateHostWorkspaceEventDetailPayload,
  UpdateHostWorkspaceEventSchedulePayload,
} from '../../services/supabase.service';

interface HostEventDetailForm {
  title: string;
  eventDomainId: number | null;
  editionId: number | null;
  eventTypeId: number | null;
  teaser: string;
  description: string;
  callToActionUrl: string;
  isMemberOnly: boolean;
  hostNotes: string;
}

interface HostEventScheduleEntryForm {
  mode: 'day_show' | 'period';
  startDate: string;
  endDate: string;
}

interface HostEventScheduleForm {
  entries: HostEventScheduleEntryForm[];
  showTime: string;
  locationId: string | null;
}

interface StandaloneEventCommentEntry {
  author_name: string;
  author_role: string | null;
  body: string;
  created_at: string | null;
}

@Component({
  selector: 'app-host-event-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, FormsModule],
  templateUrl: './host-event-detail.html',
})
export class HostEventDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private location = inject(Location);

  isLoading = true;
  isUpdating = false;
  isImageUploading = false;
  isEditingDetails = false;
  isEditingHostNotes = false;
  isEditingSchedule = false;
  isSubmittingComment = false;
  error = '';
  successMessage = '';
  event: HostWorkspaceEventDetail | null = null;
  activeTab: 'details' | 'host-notes' | 'artists' | 'show-dates' | 'media' | 'images' | 'comments' = 'details';
  commentDraft = '';
  eventDomains: Array<{ id: number; name: string }> = [];
  editionOptions: EventEditionOption[] = [];
  eventTypeOptions: EventTypeOption[] = [];
  privateLocations: TjsLocation[] = [];
  publicLocations: TjsLocation[] = [];
  detailForm: HostEventDetailForm = {
    title: '',
    eventDomainId: null,
    editionId: null,
    eventTypeId: null,
    teaser: '',
    description: '',
    callToActionUrl: '',
    isMemberOnly: false,
    hostNotes: '',
  };
  scheduleForm: HostEventScheduleForm = {
    entries: [],
    showTime: '',
    locationId: null,
  };

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    const eventId = this.route.snapshot.paramMap.get('id');
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    if (!eventId || !profileId) {
      this.error = 'Event not found.';
      this.isLoading = false;
      return;
    }

    try {
      const [event, eventDomains, editionOptions, eventTypeOptions, publicLocations] = await Promise.all([
        this.isAdmin
          ? this.supabase.getAdminWorkspaceEventDetail(eventId)
          : this.isCommitteeMember
            ? this.supabase.getCommitteeWorkspaceEventDetail(eventId)
            : this.supabase.getHostWorkspaceEventDetail(profileId, eventId),
        this.supabase.listEventDomains(),
        this.supabase.listConcreteEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
        this.supabase.getPublicLocations(),
      ]);

      this.event = event;
      this.eventDomains = eventDomains;
      this.editionOptions = editionOptions;
      this.eventTypeOptions = eventTypeOptions;
      this.publicLocations = publicLocations;

      if (!this.event) {
        this.error = 'Event not found.';
      } else {
        this.privateLocations = this.isAdmin
          ? await this.supabase.getPrivateLocationsForHost(this.event.host_ids[0] ?? 0)
          : this.canEditEvent
            ? await this.supabase.getPrivateLocations(profileId)
            : [];
        this.resetFormFromEvent();
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load event.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  setTab(tab: 'details' | 'host-notes' | 'artists' | 'show-dates' | 'media' | 'images' | 'comments') {
    this.activeTab = tab;
  }

  get isCommitteeMember(): boolean {
    return this.authService.isCommitteeMember;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get canEditEvent(): boolean {
    return !this.isCommitteeMember;
  }

  get canCommentOnEvent(): boolean {
    return !!this.event && (this.isCommitteeMember || this.isAdmin || this.authService.isHostManager);
  }

  get canViewCommentsSection(): boolean {
    return !!this.event && (
      this.isCommitteeMember
      || this.isAdmin
      || this.authService.isHostManager
      || (this.event.request_detail?.comments?.length ?? 0) > 0
      || this.standaloneCommentLines.length > 0
    );
  }

  get shouldShowHostNotes(): boolean {
    return !this.isCommitteeMember;
  }

  get isActive(): boolean {
    return this.event?.status === 'APPROVED';
  }

  get detailTitle(): string {
    return this.event?.request_detail?.event_title || this.event?.title || 'Event Detail';
  }

  get primaryHostName(): string {
    return this.event?.host_names?.[0] || 'Unassigned host';
  }

  get detailTeaser(): string {
    return this.event?.request_detail?.teaser || this.event?.description || 'No teaser available.';
  }

  get detailLongDescription(): string {
    return this.event?.request_detail?.long_teaser
      || this.event?.request_detail?.description
      || this.event?.description
      || 'No long description available.';
  }

  get cleanedHostNotes(): string {
    return this.extractFreeformHostNotes(this.event?.host_notes ?? null);
  }

  get sortedComments(): ArtistRequestCommentEntry[] {
    return [...(this.event?.request_detail?.comments ?? [])].reverse();
  }

  get standaloneCommentLines(): string[] {
    return (this.event?.host_notes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) =>
        !!line
        && !line.startsWith('Event Domain:')
        && !line.startsWith('Edition:')
        && !line.startsWith('Event Type:')
        && !line.startsWith('Show Time:')
        && !line.startsWith('Event Image:')
        && !line.startsWith('Call to Action URL:')
        && !line.startsWith('Additional Instruments:')
        && !line.startsWith('Media:')
        && !line.startsWith('[COMMENT]')
        && !line.startsWith('[SCHEDULE]')
        && !line.startsWith('- ')
      );
  }

  get standaloneComments(): StandaloneEventCommentEntry[] {
    const parsedComments = (this.event?.host_notes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('[COMMENT]'))
      .map((line) => this.parseStandaloneComment(line))
      .filter((entry): entry is StandaloneEventCommentEntry => !!entry);

    const legacyComments = this.standaloneCommentLines.map((line) => ({
      author_name: 'Host Workspace',
      author_role: null,
      body: line,
      created_at: null,
    }));

    return [...parsedComments, ...legacyComments].sort((left, right) => {
      const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
      return rightTime - leftTime;
    });
  }

  get artistEntries() {
    if (this.event?.request_detail?.artists?.length) {
      return this.event.request_detail.artists;
    }

    return (this.event?.artist_names ?? []).map((name, index) => ({
      display_name: name,
      invited_email: '',
      artist_id: null,
      invited_artist_id: null,
      is_primary: index === 0,
      instruments: index === 0 ? this.event?.instruments ?? [] : [],
    }));
  }

  get mediaEntries() {
    if (this.event?.request_detail?.media?.length) {
      return this.event.request_detail.media;
    }

    return this.extractMediaEntriesFromNotes(this.event?.host_notes ?? '');
  }

  get eventImageUrl(): string | null {
    return this.event?.request_detail?.image_url
      ?? this.extractNoteValue(this.event?.host_notes ?? '', 'Event Image:')
      ?? null;
  }

  locationLabel(location: TjsLocation): string {
    return location.name || location.city || location.address || 'Unnamed location';
  }

  get allVenueOptions(): TjsLocation[] {
    return [...this.privateLocations, ...this.publicLocations];
  }

  trackByNumericId(_: number, item: { id: number }) {
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

  async saveDetails() {
    if (!this.canEditEvent) {
      return;
    }

    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    if (!profileId || !this.event) {
      return;
    }

    this.isUpdating = true;
    this.error = '';
    this.successMessage = '';

    const payload: UpdateHostWorkspaceEventDetailPayload = {
      ...this.detailForm,
      title: this.detailForm.title.trim(),
      teaser: this.detailForm.teaser.trim(),
      description: this.detailForm.description.trim(),
      callToActionUrl: this.detailForm.callToActionUrl.trim(),
      hostNotes: this.detailForm.hostNotes,
    };

    const error = this.isAdmin
      ? await this.supabase.updateAdminWorkspaceEventDetail(this.event.id, payload)
      : await this.supabase.updateHostWorkspaceEventDetail(profileId, this.event.id, payload);
    if (error) {
      this.error = error;
      this.isUpdating = false;
      return;
    }

    await this.loadData();
    this.successMessage = 'Event details updated.';
    this.isEditingDetails = false;
    this.isEditingHostNotes = false;
    this.isUpdating = false;
  }

  async onEventImageSelected(event: Event) {
    if (!this.canEditEvent) {
      return;
    }

    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!profileId || !file || !this.event) {
      return;
    }

    this.isImageUploading = true;
    this.error = '';
    this.successMessage = '';

    const uploadResult = await this.supabase.uploadArtistWorkspaceRequestImage(profileId, file, 'request-image');
    if (uploadResult.error || !uploadResult.url) {
      this.error = uploadResult.error ?? 'Image upload failed.';
      this.isImageUploading = false;
      input.value = '';
      return;
    }

    const saveError = this.isAdmin
      ? await this.supabase.updateAdminWorkspaceEventImage(this.event.id, uploadResult.url)
      : await this.supabase.updateHostWorkspaceEventImage(profileId, this.event.id, uploadResult.url);
    if (saveError) {
      this.error = saveError;
      this.isImageUploading = false;
      input.value = '';
      return;
    }

    await this.loadData();
    this.successMessage = 'Event image updated.';
    this.isImageUploading = false;
    input.value = '';
  }

  startEditingSchedule() {
    if (!this.canEditEvent) {
      return;
    }

    this.isEditingSchedule = true;
    this.successMessage = '';
    this.error = '';
  }

  cancelEditingSchedule() {
    this.isEditingSchedule = false;
    this.resetScheduleFormFromEvent();
  }

  addScheduleEntry(mode: 'day_show' | 'period' = 'day_show') {
    this.scheduleForm = {
      ...this.scheduleForm,
      entries: [
        ...this.scheduleForm.entries,
        { mode, startDate: '', endDate: '' },
      ],
    };
  }

  removeScheduleEntry(index: number) {
    this.scheduleForm = {
      ...this.scheduleForm,
      entries: this.scheduleForm.entries.filter((_, currentIndex) => currentIndex !== index),
    };
  }

  setScheduleEntryMode(index: number, mode: 'day_show' | 'period') {
    this.scheduleForm = {
      ...this.scheduleForm,
      entries: this.scheduleForm.entries.map((entry, currentIndex) =>
        currentIndex === index
          ? {
              ...entry,
              mode,
              endDate: mode === 'period' ? entry.endDate : '',
            }
          : entry
      ),
    };
  }

  async saveSchedule() {
    if (!this.canEditEvent) {
      return;
    }

    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    if (!profileId || !this.event) {
      return;
    }

    const entries = this.scheduleForm.entries
      .map((entry) => ({
        mode: entry.mode,
        startDate: entry.startDate.trim(),
        endDate: entry.mode === 'period' ? entry.endDate.trim() : '',
      }))
      .filter((entry) => !!entry.startDate);

    if (entries.length === 0) {
      this.error = 'At least one show date or period is required.';
      return;
    }

    if (entries.some((entry) => entry.mode === 'period' && !entry.endDate)) {
      this.error = 'Each period entry requires both a start date and an end date.';
      return;
    }

    const overlapError = this.findScheduleOverlap(entries);
    if (overlapError) {
      this.error = overlapError;
      return;
    }

    this.isUpdating = true;
    this.error = '';
    this.successMessage = '';

    const payload: UpdateHostWorkspaceEventSchedulePayload = {
      entries,
      showTime: this.scheduleForm.showTime.trim(),
      locationId: this.resolvePersistedLocationId(this.scheduleForm.locationId),
    };

    const error = this.isAdmin
      ? await this.supabase.updateAdminWorkspaceEventSchedule(this.event.id, payload)
      : await this.supabase.updateHostWorkspaceEventSchedule(profileId, this.event.id, payload);
    if (error) {
      this.error = error;
      this.isUpdating = false;
      return;
    }

    await this.loadData();
    this.successMessage = 'Show dates updated.';
    this.isEditingSchedule = false;
    this.isUpdating = false;
  }

  startEditingDetails() {
    if (!this.canEditEvent) {
      return;
    }

    this.isEditingDetails = true;
    this.successMessage = '';
    this.error = '';
  }

  cancelEditingDetails() {
    this.isEditingDetails = false;
    this.resetFormFromEvent();
  }

  startEditingHostNotes() {
    if (!this.canEditEvent) {
      return;
    }

    this.isEditingHostNotes = true;
    this.successMessage = '';
    this.error = '';
  }

  cancelEditingHostNotes() {
    this.isEditingHostNotes = false;
    this.resetFormFromEvent();
  }

  async toggleActive() {
    if (!this.canEditEvent) {
      return;
    }

    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    if (!profileId || !this.event) {
      return;
    }

    this.isUpdating = true;
    this.error = '';
    this.successMessage = '';

    const nextState = !this.isActive;
    const error = this.isAdmin
      ? await this.supabase.updateAdminWorkspaceEventStatus(this.event.id, nextState)
      : await this.supabase.updateHostWorkspaceEventStatus(profileId, this.event.id, nextState);
    if (error) {
      this.error = error;
      this.isUpdating = false;
      return;
    }

    this.event = {
      ...this.event,
      status: nextState ? 'APPROVED' : 'SELECTED',
    };
    this.successMessage = `Event marked as ${nextState ? 'active' : 'inactive'}.`;
    this.isUpdating = false;
  }

  async toggleFeatured() {
    if (!this.canEditEvent) {
      return;
    }

    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    if (!profileId || !this.event) {
      return;
    }

    this.isUpdating = true;
    this.error = '';
    this.successMessage = '';

    const nextState = !this.event.is_featured;
    const error = this.isAdmin
      ? await this.supabase.updateAdminWorkspaceEventFeatured(this.event.id, nextState)
      : await this.supabase.updateHostWorkspaceEventFeatured(profileId, this.event.id, nextState);
    if (error) {
      this.error = error;
      this.isUpdating = false;
      return;
    }

    this.event = {
      ...this.event,
      is_featured: nextState,
    };
    this.successMessage = `Featured marked as ${nextState ? 'active' : 'inactive'}.`;
    this.isUpdating = false;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Active';
      case 'SELECTED':
        return 'Inactive';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'SELECTED':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  async submitComment() {
    const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
    const body = this.commentDraft.trim();
    const eventId = this.event?.id ?? '';
    const requestId = this.event?.request_detail?.id ?? '';

    if (!this.canCommentOnEvent || !profileId || !eventId || !body) {
      return;
    }

    this.isSubmittingComment = true;
    this.error = '';
    this.successMessage = '';

    const standaloneCommentLine = this.buildStandaloneCommentLine(body);
    const error = requestId
      ? await this.supabase.addArtistWorkspaceRequestComment(requestId, profileId, body)
      : this.isAdmin
        ? await this.supabase.appendAdminWorkspaceEventComment(eventId, standaloneCommentLine)
        : this.authService.isHostManager
          ? await this.supabase.appendHostWorkspaceEventComment(profileId, eventId, standaloneCommentLine)
          : 'Comments can only be added to request-backed events from this workspace.';
    if (error) {
      this.error = error;
      this.isSubmittingComment = false;
      return;
    }

    this.commentDraft = '';
    await this.loadData();
    this.activeTab = 'comments';
    this.successMessage = 'Comment added.';
    this.isSubmittingComment = false;
  }

  private resetFormFromEvent() {
    if (!this.event) {
      return;
    }

    this.detailForm = {
      title: this.event.title || this.event.request_detail?.event_title || '',
      eventDomainId: this.event.event_domain_id ?? null,
      editionId: this.matchEditionId(this.event.edition),
      eventTypeId: this.matchEventTypeId(this.event.event_type_name),
      teaser: this.event.request_detail?.teaser || this.event.description || '',
      description: this.event.request_detail?.description || this.event.description || '',
      callToActionUrl: this.event.call_to_action_url || '',
      isMemberOnly: !!this.event.is_member_only,
      hostNotes: this.extractFreeformHostNotes(this.event.host_notes),
    };
    this.resetScheduleFormFromEvent();
  }

  private resetScheduleFormFromEvent() {
    if (!this.event) {
      return;
    }

    this.scheduleForm = {
      entries: (this.event.schedule_entries ?? []).length > 0
        ? (this.event.schedule_entries ?? []).map((entry) => ({
            mode: entry.mode,
            startDate: entry.start_date,
            endDate: entry.end_date,
          }))
        : [{ mode: 'day_show', startDate: '', endDate: '' }],
      showTime: this.event.show_time || '',
      locationId: this.resolveLocationSelection(this.event.location_id ?? null, this.event.location_name ?? null),
    };
  }

  private resolvePersistedLocationId(locationId: string | null): string | null {
    if (!locationId) {
      return null;
    }

    return this.publicLocations.some((location) => location.id === locationId) ? locationId : null;
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

  private findScheduleOverlap(
    entries: Array<{ mode: 'day_show' | 'period'; startDate: string; endDate: string }>,
  ): string | null {
    const normalizedEntries = entries.map((entry, index) => {
      const start = entry.startDate;
      const end = entry.mode === 'period' ? entry.endDate : entry.startDate;
      return { index, start, end, mode: entry.mode };
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

  private matchEditionId(editionLabel: string | null | undefined): number | null {
    if (!editionLabel) {
      return null;
    }

    return this.editionOptions.find((item) =>
      item.name === editionLabel || item.label === editionLabel
    )?.id ?? null;
  }

  private matchEventTypeId(eventTypeName: string | null | undefined): number | null {
    if (!eventTypeName) {
      return null;
    }

    return this.eventTypeOptions.find((item) => item.name === eventTypeName)?.id ?? null;
  }

  private extractFreeformHostNotes(notes: string | null | undefined): string {
    return (notes ?? '')
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        return !!trimmed
          && !trimmed.startsWith('Edition:')
          && !trimmed.startsWith('Event Type:')
          && !trimmed.startsWith('Show Time:')
          && !trimmed.startsWith('Event Image:')
          && !trimmed.startsWith('Call to Action URL:')
          && !trimmed.startsWith('[COMMENT]')
          && !trimmed.startsWith('[SCHEDULE]');
      })
      .join('\n')
      .trim();
  }

  private parseStandaloneComment(line: string): StandaloneEventCommentEntry | null {
    const rawValue = line.replace('[COMMENT]', '').trim();
    const [createdAt = '', authorName = '', authorRole = '', encodedBody = ''] = rawValue.split('|');
    if (!encodedBody) {
      return null;
    }

    try {
      return {
        author_name: decodeURIComponent(authorName) || 'Unknown user',
        author_role: decodeURIComponent(authorRole) || null,
        body: decodeURIComponent(encodedBody),
        created_at: createdAt || null,
      };
    } catch {
      return null;
    }
  }

  private buildStandaloneCommentLine(body: string): string {
    const timestamp = new Date().toISOString();
    const authorName = this.authService.currentProfile?.full_name || this.authService.currentProfile?.email || 'Unknown user';
    const authorRole = this.authService.isAdmin
      ? 'Admin'
      : this.isCommitteeMember
        ? 'Committee Member'
        : this.authService.isHostManager
          ? 'Host Manager'
          : 'Host';

    return `[COMMENT] ${timestamp}|${encodeURIComponent(authorName)}|${encodeURIComponent(authorRole)}|${encodeURIComponent(body)}`;
  }

  private extractNoteValue(notes: string | null | undefined, prefix: string): string | null {
    if (!notes) {
      return null;
    }

    return notes
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith(prefix))
      ?.replace(prefix, '')
      .trim() ?? null;
  }

  private extractMediaEntriesFromNotes(notes: string | null | undefined) {
    const lines = (notes ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const headerIndex = lines.findIndex((line) => line === 'Media:');
    if (headerIndex < 0) {
      return [];
    }

    return lines
      .slice(headerIndex + 1)
      .filter((line) => line.startsWith('- '))
      .map((line) => line.replace(/^- /, '').trim())
      .map((line) => {
        const [mediaType, name, url, imageUrl] = line.split('|').map((item) => item.trim());
        return {
          media_type: mediaType || 'Video',
          image_url: imageUrl && imageUrl !== 'No image' ? imageUrl : null,
          name: name || 'Untitled media',
          description: '',
          url: url && url !== 'No link' ? url : '',
        };
      });
  }
}
