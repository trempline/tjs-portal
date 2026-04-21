import { DatePipe, Location, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
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
      const [event, eventDomains, editionOptions, eventTypeOptions, privateLocations, publicLocations] = await Promise.all([
        this.isCommitteeMember
          ? this.supabase.getCommitteeWorkspaceEventDetail(eventId)
          : this.supabase.getHostWorkspaceEventDetail(profileId, eventId),
        this.supabase.listEventDomains(),
        this.supabase.listConcreteEventEditionOptions(),
        this.supabase.listEventTypeOptions(),
        this.canEditEvent ? this.supabase.getPrivateLocations(profileId) : Promise.resolve([]),
        this.supabase.getPublicLocations(),
      ]);

      this.event = event;
      this.eventDomains = eventDomains;
      this.editionOptions = editionOptions;
      this.eventTypeOptions = eventTypeOptions;
      this.privateLocations = privateLocations;
      this.publicLocations = publicLocations;

      if (!this.event) {
        this.error = 'Event not found.';
      } else {
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

  get canEditEvent(): boolean {
    return !this.isCommitteeMember;
  }

  get canCommentOnEvent(): boolean {
    return this.isCommitteeMember && !!this.event?.request_detail?.id;
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

  get artistEntries() {
    return this.event?.request_detail?.artists ?? [];
  }

  get mediaEntries() {
    return this.event?.request_detail?.media ?? [];
  }

  get eventImageUrl(): string | null {
    return this.event?.request_detail?.image_url ?? null;
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

    const error = await this.supabase.updateHostWorkspaceEventDetail(profileId, this.event.id, payload);
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

    const saveError = await this.supabase.updateHostWorkspaceEventImage(profileId, this.event.id, uploadResult.url);
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

    const error = await this.supabase.updateHostWorkspaceEventSchedule(profileId, this.event.id, payload);
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
    const error = await this.supabase.updateHostWorkspaceEventStatus(profileId, this.event.id, nextState);
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
    const error = await this.supabase.updateHostWorkspaceEventFeatured(profileId, this.event.id, nextState);
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
    const requestId = this.event?.request_detail?.id ?? '';
    const body = this.commentDraft.trim();

    if (!this.canCommentOnEvent || !profileId || !requestId || !body) {
      return;
    }

    this.isSubmittingComment = true;
    this.error = '';
    this.successMessage = '';

    const error = await this.supabase.addArtistWorkspaceRequestComment(requestId, profileId, body);
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
          && !trimmed.startsWith('Show Time:');
      })
      .join('\n')
      .trim();
  }
}
