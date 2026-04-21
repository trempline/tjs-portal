import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistAwardEntry,
  ArtistAvailabilityEntry,
  ArtistEducationEntry,
  ArtistInstrumentOption,
  ArtistMediaEntry,
  ArtistMediaType,
  ArtistPerformanceType,
  ArtistRequestArtistEntry,
  ArtistRequestDetail,
  ArtistRequestListItem,
  ArtistWorkspaceProfile,
  HostWorkspaceEventItem,
  PagArtistProfile,
  SupabaseService,
  TjsArtist,
} from '../../services/supabase.service';

type CommitteeArtistDetailTab = 'profile' | 'instruments' | 'media' | 'availability' | 'events' | 'request';

@Component({
  selector: 'app-committee-artist-detail',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, RouterLink, FormsModule],
  templateUrl: './committee-artist-detail.html',
})
export class CommitteeArtistDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  isLoading = true;
  error = '';
  saveError = '';
  saveSuccessMessage = '';
  requestError = '';
  requestSuccessMessage = '';
  isCommentSaving = false;
  isSavingSection = false;
  isUploadingBanner = false;
  isUploadingAvatar = false;
  uploadingMediaKey: string | null = null;
  requestCommentDraft = '';

  artist: TjsArtist | null = null;
  activeTab: CommitteeArtistDetailTab = 'profile';
  profile: ArtistWorkspaceProfile | null = null;
  pagProfile: PagArtistProfile | null = null;
  instruments: ArtistInstrumentOption[] = [];
  media: ArtistMediaEntry[] = [];
  availability: ArtistAvailabilityEntry[] = [];
  editableProfile: ArtistWorkspaceProfile | null = null;
  editableInstruments: ArtistInstrumentOption[] = [];
  editableMedia: ArtistMediaEntry[] = [];
  editableAvailability: ArtistAvailabilityEntry[] = [];
  pendingRequests: ArtistRequestListItem[] = [];
  upcomingEvents: HostWorkspaceEventItem[] = [];
  selectedRequest: ArtistRequestDetail | null = null;
  requestLoading = false;
  performanceOptions: ArtistPerformanceType[] = [];
  instrumentOptions: ArtistInstrumentOption[] = [];
  selectedPerformanceId = '';
  selectedInstrumentId = '';
  isProfileEditing = false;
  isInstrumentEditing = false;
  isMediaEditing = false;
  isAvailabilityEditing = false;

  async ngOnInit() {
    const artistId = this.route.snapshot.paramMap.get('id');

    if (!artistId) {
      this.error = 'Artist not found.';
      this.isLoading = false;
      return;
    }

    await this.loadArtistDetail(artistId);
  }

  setTab(tab: CommitteeArtistDetailTab) {
    this.activeTab = tab;
  }

  displayName(): string {
    if (!this.artist) {
      return this.pagDisplayName();
    }

    return this.artist.profile?.full_name || this.artist.artist_name || 'Artist';
  }

  avatarLetter(): string {
    return this.displayName().charAt(0).toUpperCase();
  }

  artistEmail(): string {
    return this.profile?.email || this.artist?.profile?.email || this.pagEmail();
  }

  artistPhone(): string {
    return this.profile?.phone || this.artist?.profile?.phone || this.pagPhone();
  }

  hasPagProfile(): boolean {
    return !!this.pagProfile;
  }

  pagDisplayName(): string {
    if (!this.pagProfile) {
      return 'PAG Artist';
    }

    return `${this.pagProfile.fname ?? ''} ${this.pagProfile.lname ?? ''}`.trim() || 'PAG Artist';
  }

  pagEmail(): string {
    return this.pagProfile?.email || '-';
  }

  pagPhone(): string {
    return this.pagProfile?.phone || '-';
  }

  pagStatusLabel(): string {
    return this.pagProfile?.is_active ? 'Active' : 'Inactive';
  }

  get isPagOnlyProfile(): boolean {
    return !this.artist && !!this.pagProfile;
  }

  get isInvitedArtistProfile(): boolean {
    return !!this.artist?.is_invited_artist && !this.artist?.is_tjs_artist;
  }

  get isHostWorkspace(): boolean {
    return this.route.snapshot.routeConfig?.path === 'host/artists/:id';
  }

  get isHostManagerWorkspace(): boolean {
    return this.route.snapshot.routeConfig?.path === 'host-manager/artists/tjs/:id';
  }

  get canEditTjsArtist(): boolean {
    return this.authService.hasRole('Committee Member') && !!this.artist?.is_tjs_artist && !this.isPagOnlyProfile;
  }

  get backLink(): string {
    if (this.isHostWorkspace) {
      return '/backoffice/host/artists';
    }

    if (this.isHostManagerWorkspace) {
      return '/backoffice/host-manager/artists/tjs';
    }

    return this.isPagOnlyProfile
      ? '/backoffice/artists/non-tjs'
      : (this.isInvitedArtistProfile ? '/backoffice/artists/invited' : '/backoffice/artists');
  }

  get backLabel(): string {
    if (this.isHostWorkspace) {
      return 'Back to TJS Artists';
    }

    if (this.isHostManagerWorkspace) {
      return 'Back to TJS Artists';
    }

    return this.isPagOnlyProfile
      ? 'Back to PAG Artists'
      : (this.isInvitedArtistProfile ? 'Back to Invited Artists' : 'Back to TJS Artists');
  }

  get pageDescription(): string {
    if (this.isHostWorkspace) {
      return 'Host workspace view of the full artist profile.';
    }

    if (this.isHostManagerWorkspace) {
      return 'Host manager workspace view of the artist profile, requests, availability, media, and upcoming events.';
    }

    return this.isPagOnlyProfile
      ? 'Committee workspace view of the legacy PAG artist profile.'
      : (this.isInvitedArtistProfile ? 'Committee workspace view of the invited artist profile.' : 'Committee workspace view of the full artist profile.');
  }

  get requestTabTitle(): string {
    return this.isHostWorkspace || this.isHostManagerWorkspace ? 'Open / New Requests' : 'New Requests';
  }

  get requestTabDescription(): string {
    return this.isHostWorkspace || this.isHostManagerWorkspace
      ? 'Review new requests and artist re-proposals submitted by this artist.'
      : 'Review new requests submitted by this artist.';
  }

  looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  activationStatusLabel(): string {
    if (!this.artist) {
      return this.pagStatusLabel();
    }

    switch (this.artist?.activation_status) {
      case 'active':
        return 'Activated';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Pending';
    }
  }

  performanceTypeLabel(): string {
    if (!this.profile?.performance_types.length) {
      return 'No performance types added';
    }

    return this.profile.performance_types.map((item) => item.name).join(', ');
  }

  pagPerformanceTypeLabel(): string {
    if (!this.pagProfile?.performances.length) {
      return 'No PAG performance types added';
    }

    return this.pagProfile.performances.map((item) => item.name).join(', ');
  }

  mediaByType(type: 'video' | 'cd'): ArtistMediaEntry[] {
    return this.media.filter((item) => item.media_type === type);
  }

  pagMediaByType(type: 'video' | 'cd'): ArtistMediaEntry[] {
    return (this.pagProfile?.media ?? []).filter((item) => item.media_type === type);
  }

  availabilityDays(entry: ArtistAvailabilityEntry): number {
    if (!entry.start_date || !entry.end_date) {
      return 0;
    }

    const start = new Date(`${entry.start_date}T00:00:00`);
    const end = new Date(`${entry.end_date}T00:00:00`);
    const difference = end.getTime() - start.getTime();
    return difference >= 0 ? Math.floor(difference / 86400000) + 1 : 0;
  }

  trackByIndex(index: number) {
    return index;
  }

  trackByNumericId(_: number, item: { id: number }) {
    return item.id;
  }

  trackByOptionalId(index: number, item: { id?: string }) {
    return item.id ?? index;
  }

  trackByRequest(_: number, item: ArtistRequestListItem) {
    return item.id;
  }

  trackByEvent(_: number, item: HostWorkspaceEventItem) {
    return item.id;
  }

  trackByPerformance(_: number, item: ArtistPerformanceType) {
    return item.id;
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get requestAdditionalArtists(): ArtistRequestArtistEntry[] {
    return (this.selectedRequest?.artists ?? []).filter((artist) => !artist.is_primary && !this.isInvitedRequestArtist(artist));
  }

  get requestInvitedArtists(): ArtistRequestArtistEntry[] {
    return (this.selectedRequest?.artists ?? []).filter((artist) => this.isInvitedRequestArtist(artist));
  }

  get selectedRequestSummary(): ArtistRequestListItem | null {
    if (!this.selectedRequest?.id) {
      return null;
    }

    return this.pendingRequests.find((request) => request.id === this.selectedRequest?.id) ?? null;
  }

  isSelectedRequest(request: ArtistRequestListItem): boolean {
    return this.selectedRequest?.id === request.id;
  }

  isInvitedRequestArtist(artist: ArtistRequestArtistEntry): boolean {
    return !!artist.invited_email || (!!artist.invited_artist_id && !artist.artist_id);
  }

  async openRequest(requestId: string) {
    this.requestLoading = true;
    this.requestError = '';
    this.requestSuccessMessage = '';
    this.requestCommentDraft = '';

    try {
      this.selectedRequest = await this.supabase.getArtistWorkspaceRequestDetail(requestId);
      if (!this.selectedRequest) {
        this.requestError = 'Request details could not be loaded.';
      }
    } catch (error) {
      this.requestError = error instanceof Error ? error.message : 'Request details could not be loaded.';
      this.selectedRequest = null;
    } finally {
      this.requestLoading = false;
    }
  }

  async addRequestComment() {
    if (!this.selectedRequest?.id || !this.currentUserId) {
      this.requestError = 'Comment could not be added.';
      return;
    }

    if (!this.requestCommentDraft.trim()) {
      this.requestError = 'Comment is required.';
      return;
    }

    this.isCommentSaving = true;
    this.requestError = '';
    this.requestSuccessMessage = '';

    const error = await this.supabase.addArtistWorkspaceRequestComment(
      this.selectedRequest.id,
      this.currentUserId,
      this.requestCommentDraft
    );

    if (error) {
      this.requestError = error;
      this.isCommentSaving = false;
      return;
    }

    const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(this.selectedRequest.id);
    if (refreshed) {
      this.selectedRequest = refreshed;
    }

    this.requestCommentDraft = '';
    this.requestSuccessMessage = 'Comment added successfully.';
    this.isCommentSaving = false;
  }

  requestStatusLabel(status: ArtistRequestListItem['status'] | ArtistRequestDetail['status']): string {
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
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  requestStatusClass(status: ArtistRequestListItem['status'] | ArtistRequestDetail['status']): string {
    switch (status) {
      case 'new_request':
        return 'bg-amber-100 text-amber-700';
      case 'accepted_by_host':
        return 'bg-cyan-100 text-cyan-700';
      case 'host_proposed':
        return 'bg-sky-100 text-sky-700';
      case 'artist_proposed':
        return 'bg-violet-100 text-violet-700';
      case 'artist_accepted':
        return 'bg-emerald-100 text-emerald-700';
      case 'approved':
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  }

  upcomingEventStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Upcoming';
      case 'SELECTED':
        return 'Pending';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  upcomingEventStatusClass(status: string): string {
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

  upcomingEventInstrumentLabel(item: HostWorkspaceEventItem): string {
    if (item.instruments.length === 0) {
      return 'No instruments';
    }

    if (item.instruments.length === 1) {
      return item.instruments[0];
    }

    return `${item.instruments[0]} +${item.instruments.length - 1}`;
  }

  startEditingProfile() {
    if (!this.profile || !this.canEditTjsArtist) return;
    this.resetSaveMessages();
    this.isProfileEditing = true;
    this.editableProfile = this.cloneProfile(this.profile);
    this.selectedPerformanceId = '';
  }

  cancelEditingProfile() {
    this.isProfileEditing = false;
    this.editableProfile = this.profile ? this.cloneProfile(this.profile) : null;
    this.resetSaveMessages();
  }

  addPerformanceType() {
    const performanceId = Number(this.selectedPerformanceId);
    if (!performanceId || !this.editableProfile) return;
    const selected = this.performanceOptions.find((option) => option.id === performanceId);
    if (selected && !this.editableProfile.performance_types.some((item) => item.id === selected.id)) {
      this.editableProfile.performance_types = [...this.editableProfile.performance_types, selected];
    }
    this.selectedPerformanceId = '';
  }

  removePerformanceType(performanceId: number) {
    if (!this.editableProfile) return;
    this.editableProfile.performance_types = this.editableProfile.performance_types.filter((item) => item.id !== performanceId);
  }

  addEducation() {
    if (!this.editableProfile) return;
    this.editableProfile.educations = [...this.editableProfile.educations, this.blankEducation()];
  }

  removeEducation(index: number) {
    if (!this.editableProfile) return;
    this.editableProfile.educations = this.editableProfile.educations.filter((_, itemIndex) => itemIndex !== index);
    if (this.editableProfile.educations.length === 0) {
      this.editableProfile.educations = [this.blankEducation()];
    }
  }

  addAward() {
    if (!this.editableProfile) return;
    this.editableProfile.awards = [...this.editableProfile.awards, this.blankAward()];
  }

  removeAward(index: number) {
    if (!this.editableProfile) return;
    this.editableProfile.awards = this.editableProfile.awards.filter((_, itemIndex) => itemIndex !== index);
    if (this.editableProfile.awards.length === 0) {
      this.editableProfile.awards = [this.blankAward()];
    }
  }

  async onProfileImageSelected(event: Event, kind: 'banner' | 'avatar') {
    if (!this.editableProfile || !this.canEditTjsArtist) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.resetSaveMessages();
    if (kind === 'banner') {
      this.isUploadingBanner = true;
    } else {
      this.isUploadingAvatar = true;
    }
    const { url, error } = await this.supabase.uploadArtistWorkspaceImage(this.editableProfile.profile_id, file, kind);
    if (error) {
      this.saveError = error;
    } else if (url) {
      if (kind === 'banner') {
        this.editableProfile.banner_url = url;
      } else {
        this.editableProfile.profile_picture_url = url;
      }
    }
    if (kind === 'banner') {
      this.isUploadingBanner = false;
    } else {
      this.isUploadingAvatar = false;
    }
    input.value = '';
  }

  async saveProfile() {
    if (!this.editableProfile) return;
    this.resetSaveMessages();
    if (!this.editableProfile.first_name.trim() || !this.editableProfile.last_name.trim()) {
      this.saveError = 'First name and last name are required.';
      return;
    }
    if (!this.editableProfile.email.trim()) {
      this.saveError = 'Email is required.';
      return;
    }
    this.isSavingSection = true;
    const error = await this.supabase.saveArtistWorkspaceProfile(this.editableProfile);
    if (error) {
      this.saveError = error;
    } else {
      this.profile = this.cloneProfile(this.editableProfile);
      this.editableProfile = this.cloneProfile(this.editableProfile);
      this.isProfileEditing = false;
      this.saveSuccessMessage = 'Artist profile saved successfully.';
    }
    this.isSavingSection = false;
  }

  startEditingInstruments() {
    if (!this.canEditTjsArtist) return;
    this.resetSaveMessages();
    this.isInstrumentEditing = true;
    this.editableInstruments = this.instruments.map((item) => ({ ...item }));
    this.selectedInstrumentId = '';
  }

  cancelEditingInstruments() {
    this.isInstrumentEditing = false;
    this.editableInstruments = this.instruments.map((item) => ({ ...item }));
    this.resetSaveMessages();
  }

  addInstrument() {
    const instrumentId = Number(this.selectedInstrumentId);
    if (!instrumentId) return;
    const selected = this.instrumentOptions.find((option) => option.id === instrumentId);
    if (selected && !this.editableInstruments.some((item) => item.id === selected.id)) {
      this.editableInstruments = [...this.editableInstruments, selected];
    }
    this.selectedInstrumentId = '';
  }

  removeInstrument(instrumentId: number) {
    this.editableInstruments = this.editableInstruments.filter((item) => item.id !== instrumentId);
  }

  async saveInstruments() {
    if (!this.artist?.profile_id) return;
    this.resetSaveMessages();
    this.isSavingSection = true;
    const error = await this.supabase.saveArtistWorkspaceInstruments(this.artist.profile_id, this.editableInstruments);
    if (error) {
      this.saveError = error;
    } else {
      this.instruments = this.editableInstruments.map((item) => ({ ...item }));
      this.isInstrumentEditing = false;
      this.saveSuccessMessage = 'Artist instruments saved successfully.';
    }
    this.isSavingSection = false;
  }

  startEditingMedia() {
    if (!this.canEditTjsArtist) return;
    this.resetSaveMessages();
    this.isMediaEditing = true;
    this.editableMedia = this.media.map((item) => this.cloneMediaEntry(item));
  }

  cancelEditingMedia() {
    this.isMediaEditing = false;
    this.editableMedia = this.media.map((item) => this.cloneMediaEntry(item));
    this.resetSaveMessages();
  }

  editableMediaByType(type: ArtistMediaType): ArtistMediaEntry[] {
    return this.editableMedia.filter((item) => item.media_type === type);
  }

  addMedia(mediaType: ArtistMediaType) {
    this.editableMedia = [...this.editableMedia, this.blankMedia(mediaType)];
  }

  removeMedia(entry: ArtistMediaEntry) {
    this.editableMedia = this.editableMedia.filter((item) => item !== entry);
  }

  addMediaUrl(media: ArtistMediaEntry) {
    media.urls = [...media.urls, ''];
  }

  removeMediaUrl(media: ArtistMediaEntry, urlIndex: number) {
    media.urls = media.urls.filter((_, index) => index !== urlIndex);
    if (media.urls.length === 0) {
      media.urls = [''];
    }
  }

  isUploadingMedia(mediaType: ArtistMediaType, index: number): boolean {
    return this.uploadingMediaKey === `${mediaType}-${index}`;
  }

  async onMediaImageSelected(event: Event, media: ArtistMediaEntry, mediaType: ArtistMediaType, index: number) {
    if (!this.artist?.profile_id) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.resetSaveMessages();
    this.uploadingMediaKey = `${mediaType}-${index}`;
    const { url, error } = await this.supabase.uploadArtistWorkspaceMediaImage(this.artist.profile_id, file);
    if (error) {
      this.saveError = error;
    } else {
      media.image_url = url;
    }
    this.uploadingMediaKey = null;
    input.value = '';
  }

  async saveMedia() {
    if (!this.artist?.profile_id) return;
    this.resetSaveMessages();
    this.isSavingSection = true;
    const error = await this.supabase.saveArtistWorkspaceMedia(this.artist.profile_id, this.editableMedia);
    if (error) {
      this.saveError = error;
    } else {
      this.media = this.editableMedia.map((item) => this.cloneMediaEntry(item));
      this.isMediaEditing = false;
      this.saveSuccessMessage = 'Artist media saved successfully.';
    }
    this.isSavingSection = false;
  }

  startEditingAvailability() {
    if (!this.canEditTjsArtist) return;
    this.resetSaveMessages();
    this.isAvailabilityEditing = true;
    this.editableAvailability = this.availability.map((item) => ({ ...item }));
    if (this.editableAvailability.length === 0) {
      this.editableAvailability = [this.blankAvailability()];
    }
  }

  cancelEditingAvailability() {
    this.isAvailabilityEditing = false;
    this.editableAvailability = this.availability.map((item) => ({ ...item }));
    this.resetSaveMessages();
  }

  addAvailabilityEntry() {
    this.editableAvailability = [...this.editableAvailability, this.blankAvailability()];
  }

  removeAvailabilityEntry(index: number) {
    this.editableAvailability = this.editableAvailability.filter((_, itemIndex) => itemIndex !== index);
    if (this.editableAvailability.length === 0) {
      this.editableAvailability = [this.blankAvailability()];
    }
  }

  async saveAvailability() {
    if (!this.artist?.profile_id) return;
    this.resetSaveMessages();
    const invalidRange = this.editableAvailability.find((entry) => entry.start_date && entry.end_date && entry.end_date < entry.start_date);
    if (invalidRange) {
      this.saveError = 'End date must be on or after start date.';
      return;
    }
    this.isSavingSection = true;
    const error = await this.supabase.saveArtistWorkspaceAvailability(this.artist.profile_id, this.editableAvailability);
    if (error) {
      this.saveError = error;
    } else {
      this.availability = this.editableAvailability.map((item) => ({ ...item }));
      this.isAvailabilityEditing = false;
      this.saveSuccessMessage = 'Artist availability saved successfully.';
    }
    this.isSavingSection = false;
  }

  private async loadArtistDetail(artistId: string) {
    this.isLoading = true;
    this.error = '';

    try {
      if (!this.looksLikeUuid(artistId)) {
        this.artist = null;
        this.profile = null;
        this.instruments = [];
        this.media = [];
        this.availability = [];
        this.pendingRequests = [];
        this.upcomingEvents = [];
        this.selectedRequest = null;
        this.pagProfile = await this.supabase.getPagArtistProfile(artistId);

        if (!this.pagProfile) {
          this.error = 'Artist profile could not be loaded.';
        }

        return;
      }

      const artist = await this.supabase.getArtistById(artistId);

      if (!artist || !artist.profile_id) {
        this.error = 'Artist profile could not be loaded.';
        this.isLoading = false;
        return;
      }

      this.artist = artist;

      const [profile, instruments, media, availability, requests, upcomingEvents, pagProfile, performanceOptions, instrumentOptions] = await Promise.all([
        this.supabase.getArtistWorkspaceProfile(artist.profile_id),
        this.supabase.getArtistWorkspaceInstruments(artist.profile_id),
        this.supabase.getArtistWorkspaceMedia(artist.profile_id),
        this.supabase.getArtistWorkspaceAvailability(artist.profile_id),
        this.supabase.getArtistWorkspaceRequests(artist.profile_id),
        this.supabase.getArtistWorkspaceEvents(artist.profile_id),
        artist.pag_artist_id ? this.supabase.getPagArtistProfile(artist.pag_artist_id) : Promise.resolve(null),
        this.supabase.listArtistPerformanceTypes(),
        this.supabase.listArtistInstrumentOptions(),
      ]);

      this.profile = profile;
      this.editableProfile = profile ? this.cloneProfile(profile) : null;
      this.pagProfile = pagProfile;
      this.instruments = instruments;
      this.editableInstruments = instruments.map((item) => ({ ...item }));
      this.media = media;
      this.editableMedia = media.map((item) => this.cloneMediaEntry(item));
      this.availability = availability;
      this.editableAvailability = availability.map((item) => ({ ...item }));
      this.performanceOptions = performanceOptions;
      this.instrumentOptions = instrumentOptions;
      const visibleRequestStatuses = this.isHostWorkspace || this.isHostManagerWorkspace
        ? ['new_request', 'artist_proposed']
        : ['new_request'];
      this.pendingRequests = requests.filter((request) => visibleRequestStatuses.includes(request.status));
      this.upcomingEvents = upcomingEvents
        .filter((event) => !!event.primary_upcoming_date)
        .sort((a, b) => (a.primary_upcoming_date ?? '9999-12-31').localeCompare(b.primary_upcoming_date ?? '9999-12-31'));

      if (this.pendingRequests.length > 0) {
        await this.openRequest(this.pendingRequests[0].id);
      } else {
        this.selectedRequest = null;
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist profile could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  private resetSaveMessages() {
    this.saveError = '';
    this.saveSuccessMessage = '';
  }

  private blankEducation(): ArtistEducationEntry {
    return { school_name: '', course_name: '', year: null };
  }

  private blankAward(): ArtistAwardEntry {
    return { award: '', description: '', year: null };
  }

  private blankMedia(mediaType: ArtistMediaType): ArtistMediaEntry {
    return { media_type: mediaType, image_url: null, name: '', description: '', urls: [''] };
  }

  private blankAvailability(): ArtistAvailabilityEntry {
    return { start_date: '', end_date: '', note: '' };
  }

  private cloneProfile(profile: ArtistWorkspaceProfile): ArtistWorkspaceProfile {
    return {
      ...profile,
      performance_types: profile.performance_types.map((item) => ({ ...item })),
      educations: profile.educations.length ? profile.educations.map((item) => ({ ...item })) : [this.blankEducation()],
      awards: profile.awards.length ? profile.awards.map((item) => ({ ...item })) : [this.blankAward()],
    };
  }

  private cloneMediaEntry(entry: ArtistMediaEntry): ArtistMediaEntry {
    return {
      ...entry,
      urls: entry.urls.length ? [...entry.urls] : [''],
    };
  }
}
