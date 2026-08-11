import { Component, OnInit, inject } from '@angular/core';
import { WorkspaceEditActions } from '../../shared/workspace-edit/workspace-edit-actions';
import { remainingCharacters } from '../../shared/artist-biography/artist-biography.util';
import {
  MAX_ARTIST_REQUEST_DESCRIPTION_LENGTH,
  MAX_ARTIST_REQUEST_LONG_TEASER_LENGTH,
  MAX_ARTIST_REQUEST_TEASER_LENGTH,
} from '../../shared/artist-request/artist-request-text.util';
import { ImageCopyrightTag } from '../../shared/image-copyright/image-copyright-tag';
import { validateArtistRequestDates } from '../../shared/request-dates/request-dates.util';
import {
  canEditArtistRequest,
  COLLABORATOR_LOCKED_MESSAGE,
} from '../../shared/artist-request/artist-request-permissions.util';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistRequestArtistEntry,
  ArtistRequestCommentEntry,
  ArtistRequestDateEntry,
  ArtistRequestDetail,
  ArtistRequestZoneEntry,
  ArtistInstrumentOption,
  ArtistRequestListItem,
  ArtistRequestMediaEntry,
  GeographicalZoneOption,
  InvitedArtistOption,
  PagArtistOption,
  SupabaseService,
} from '../../services/supabase.service';

type RequestTab = 'details' | 'dates' | 'zones' | 'proposed_dates' | 'image' | 'media' | 'artist' | 'comments';

/** A residence runs over a period; a concert is a single day show. */
type RequestFormat = 'residence' | 'concert';

interface HostProposalSummary {
  edition: string | null;
  eventType: string | null;
  dateLines: string[];
  rawBody: string;
}

@Component({
  selector: 'app-artist-requests',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe, RouterLink, WorkspaceEditActions, ImageCopyrightTag],
  templateUrl: './artist-requests.html',
})
export class ArtistRequests implements OnInit {
  private static readonly DUPLICATE_DRAFT_STATE_KEY = 'artistRequestDuplicateDraft';
  /**
   * Temporary: new requests go out under this domain and the field is locked.
   * Remove this constant and the two getters below to hand the choice back.
   */
  private static readonly FROZEN_EVENT_DOMAIN_NAME = 'Musique Classique';
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private currentProfileId: string | null = null;
  private currentArtistId: string | null = null;
  private currentArtistName = '';
  private seenCommentMap: Record<string, string> = {};
  private isSubmittingArtistProposal = false;
  private originalDatesSignature = '';
  private chosenRequestFormat: RequestFormat | null = null;
  private pendingNewRequestDraft: ArtistRequestDetail | null = null;
  private hasPreparedNewRequestRoute = false;

  isLoading = true;
  isDetailLoading = false;
  isSaving = false;
  isAddingComment = false;
  isRequestImageUploading = false;
  isEditing = false;
  isDeleteConfirmOpen = false;
  isDeletingRequest = false;
  error = '';
  successMessage = '';

  readonly maxRequestTeaserLength = MAX_ARTIST_REQUEST_TEASER_LENGTH;
  readonly maxRequestLongTeaserLength = MAX_ARTIST_REQUEST_LONG_TEASER_LENGTH;
  readonly maxRequestDescriptionLength = MAX_ARTIST_REQUEST_DESCRIPTION_LENGTH;

  requests: ArtistRequestListItem[] = [];
  eventDomains: Array<{ id: number; name: string }> = [];
  geographicalZones: GeographicalZoneOption[] = [];
  selectedZoneKey = '';
  tjsArtists: Array<{ id: string; artist_name: string; profile_id: string; instruments: string[] }> = [];
  invitedArtistOptions: InvitedArtistOption[] = [];
  pagArtistOptions: PagArtistOption[] = [];
  artistInstruments: ArtistInstrumentOption[] = [];

  selectedTjsArtistId = '';
  selectedInvitedArtistId = '';
  selectedPagArtistId = '';

  requestSearch = '';

  isEditorOpen = false;
  activeTab: RequestTab = 'details';
  selectedRequestId: string | null = null;
  commentDraft = '';
  initialCommentPreview = '';
  showInviteArtistForm = false;

  inviteArtist = {
    email: '',
    fullName: '',
  };

  request: ArtistRequestDetail = this.blankRequest();

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist requests could not be loaded.';
      this.isLoading = false;
      return;
    }

    this.currentProfileId = profileId;
    this.loadSeenCommentMap(profileId);
    await this.loadData(profileId);
    this.route.url.subscribe(() => {
      void this.syncEditorWithRoute();
    });
    this.route.paramMap.subscribe(() => {
      void this.syncEditorWithRoute();
    });
  }

  /**
   * Invited artists take part in requests raised by others; they do not raise their own.
   */
  get canCreateRequest(): boolean {
    return !this.authService.isInvitedArtist;
  }

  async openNewRequest() {
    if (!this.canCreateRequest) {
      return;
    }

    await this.router.navigate(['/backoffice/artist-requests/new']);
  }

  private prepareNewRequest() {
    // Guards the /new route for anyone who reaches it directly.
    if (!this.canCreateRequest) {
      void this.router.navigate(['/backoffice/artist-requests']);
      return;
    }

    if (this.hasPreparedNewRequestRoute && !this.pendingNewRequestDraft && this.isEditorOpen && !this.selectedRequestId) {
      return;
    }

    const routeDraft = this.readDuplicateDraftFromRouteState();
    const nextRequest = this.pendingNewRequestDraft ?? routeDraft ?? this.blankRequest();

    this.error = '';
    this.successMessage = '';
    this.isEditorOpen = true;
    this.isDetailLoading = false;
    this.activeTab = 'details';
    this.selectedRequestId = null;
    this.request = this.applyPrimaryArtist(nextRequest);
    this.pendingNewRequestDraft = null;
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.inviteArtist = { email: '', fullName: '' };
    this.showInviteArtistForm = false;
    this.selectedZoneKey = '';
    this.selectedTjsArtistId = '';
    this.selectedInvitedArtistId = '';
    this.selectedPagArtistId = '';
    this.chosenRequestFormat = null;
    this.isSubmittingArtistProposal = false;
    this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
    this.isEditing = true;
    this.hasPreparedNewRequestRoute = true;
  }

  async openExistingRequest(requestId: string) {
    await this.router.navigate(['/backoffice/artist-requests', requestId]);
  }

  private async loadExistingRequest(requestId: string) {
    this.hasPreparedNewRequestRoute = false;
    this.error = '';
    this.successMessage = '';
    this.isEditorOpen = true;
    this.isDetailLoading = true;
    this.activeTab = 'details';
    this.selectedRequestId = requestId;
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.inviteArtist = { email: '', fullName: '' };
    this.showInviteArtistForm = false;
    this.selectedZoneKey = '';
    this.selectedTjsArtistId = '';
    this.selectedInvitedArtistId = '';
    this.selectedPagArtistId = '';
    this.chosenRequestFormat = null;
    this.isSubmittingArtistProposal = false;

    const detail = await this.supabase.getArtistWorkspaceRequestDetail(requestId);
    if (!detail) {
      this.error = 'Request details could not be loaded.';
      this.isDetailLoading = false;
      return;
    }

    this.request = this.applyPrimaryArtist({
      ...detail,
      dates: this.normalizeRequestDates(detail.dates),
    });
    this.markRequestCommentsAsSeen(requestId, detail.comments.at(-1)?.created_at ?? null);
    this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
    this.isEditing = false;
    this.isDetailLoading = false;
  }

  async closeEditor() {
    await this.router.navigate(['/backoffice/artist-requests']);
  }

  private resetEditorState() {
    this.isEditorOpen = false;
    this.isDetailLoading = false;
    this.selectedRequestId = null;
    this.request = this.blankRequest();
    this.isEditing = false;
    this.isDeleteConfirmOpen = false;
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.showInviteArtistForm = false;
    this.selectedZoneKey = '';
    this.selectedTjsArtistId = '';
    this.selectedInvitedArtistId = '';
    this.selectedPagArtistId = '';
    this.chosenRequestFormat = null;
    this.isSubmittingArtistProposal = false;
    this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
    this.hasPreparedNewRequestRoute = false;
  }

  startEditing() {
    if (!this.request.id) {
      return;
    }

    if (!this.canEditSelectedRequest()) {
      this.error = this.requestLockReason;
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
  }

  async duplicateRequest() {
    if (!this.selectedRequestId) {
      return;
    }

    const detail = await this.supabase.getArtistWorkspaceRequestDetail(this.selectedRequestId);
    if (!detail) {
      this.error = 'Request could not be duplicated.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.selectedRequestId = null;
    this.activeTab = 'details';
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.isEditing = true;
    this.isEditorOpen = true;
    this.isDetailLoading = false;
    this.showInviteArtistForm = false;
    this.isDeleteConfirmOpen = false;
    this.isSubmittingArtistProposal = false;
    this.hasPreparedNewRequestRoute = false;
    const duplicatedRequest = this.applyPrimaryArtist({
      ...detail,
      id: undefined,
      created_by: null,
      event_title: `${detail.event_title} Copy`,
      status: 'new_request',
      comments: [],
      artists: detail.artists.map((artist) => ({
        ...artist,
        id: undefined,
      })),
      media: detail.media.map((media) => ({
        ...media,
        id: undefined,
      })),
      dates: this.normalizeRequestDates(detail.dates).map((date) => ({
        ...date,
        id: undefined,
      })),
      zones: detail.zones.map((zone) => ({
        ...zone,
        id: undefined,
      })),
    });
    this.pendingNewRequestDraft = duplicatedRequest;
    this.request = duplicatedRequest;
    this.originalDatesSignature = this.buildDatesSignature(this.request.dates);

    await this.router.navigate(['/backoffice/artist-requests/new'], {
      state: {
        [ArtistRequests.DUPLICATE_DRAFT_STATE_KEY]: duplicatedRequest,
      },
    });
  }

  openDeleteConfirm() {
    if (!this.canDeleteSelectedRequest()) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm() {
    if (this.isDeletingRequest) {
      return;
    }

    this.isDeleteConfirmOpen = false;
  }

  async deleteRequest() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request.id || this.isPublishedRequestLocked()) {
      this.error = 'Request could not be deleted.';
      return;
    }

    this.isDeletingRequest = true;
    const deleteError = await this.supabase.deleteArtistWorkspaceRequest(profileId, this.request.id);
    if (deleteError) {
      this.error = deleteError;
      this.isDeletingRequest = false;
      return;
    }

    this.isDeleteConfirmOpen = false;
    this.isDeletingRequest = false;
    this.successMessage = 'Request deleted successfully.';
    await this.closeEditor();
    await this.loadRequests(profileId);
  }

  canDeleteSelectedRequest(): boolean {
    // Deleting stays with the artist who created the request.
    return !!this.request.id
      && this.isRequestOwner
      && this.request.status !== 'approved'
      && !this.isPublishedRequestLocked();
  }

  addDate() {
    if (!this.isEditing) {
      return;
    }

    this.request.dates = [...this.request.dates, this.applyFormatToDate(this.blankDate(), this.requestFormat)];
  }

  /**
   * Read off the dates themselves, so a saved request comes back on the right choice.
   * With no dates left to read, the last choice made on this form stands in.
   */
  get requestFormat(): RequestFormat {
    if (this.request.dates.length === 0 && this.chosenRequestFormat) {
      return this.chosenRequestFormat;
    }

    return this.request.dates.some((date) => date.is_residence) ? 'residence' : 'concert';
  }

  /** The choice drives every date on the request: a residence is a period, a concert a day show. */
  setRequestFormat(format: RequestFormat) {
    if (!this.isEditing) {
      return;
    }

    this.chosenRequestFormat = format;
    this.request.dates = this.request.dates.map((date) => this.applyFormatToDate(date, format));
  }

  private applyFormatToDate(date: ArtistRequestDateEntry, format: RequestFormat): ArtistRequestDateEntry {
    if (format === 'residence') {
      return { ...date, is_residence: true, request_type: 'period' };
    }

    return { ...date, is_residence: false, request_type: 'day_show', end_date: '' };
  }

  removeDate(index: number) {
    if (!this.isEditing) {
      return;
    }

    this.request.dates = this.request.dates.filter((_, itemIndex) => itemIndex !== index);
  }

  /** Identity of a zone: the list has no key of its own, so department + city stands in. */
  private zoneKey(zone: { departement: string; ville: string }): string {
    return `${zone.departement}::${zone.ville}`.toLowerCase();
  }

  /** Option value of the multi-select; the key doubles as the option identity. */
  zoneOptionKey(zone: { departement: string; ville: string }): string {
    return this.zoneKey(zone);
  }

  /** How a zone reads everywhere it is shown: "departement - ville". */
  zoneLabel(zone: { departement: string; ville: string }): string {
    return `${zone.departement} - ${zone.ville}`;
  }

  /** Zones still on offer: the dropdown drops whatever is already on the request. */
  get availableZones(): GeographicalZoneOption[] {
    return this.geographicalZones.filter((zone) => !this.isZoneSelected(zone));
  }

  /** Adds the zone picked in the dropdown, one at a time, as the instruments tab does. */
  addZone() {
    if (!this.isEditing || !this.selectedZoneKey) {
      return;
    }

    const zone = this.geographicalZones.find((item) => this.zoneKey(item) === this.selectedZoneKey);
    if (zone && !this.isZoneSelected(zone)) {
      this.request.zones = [...this.request.zones, { ...zone }];
    }

    this.selectedZoneKey = '';
  }

  get selectedZones(): ArtistRequestZoneEntry[] {
    return [...this.request.zones].sort((a, b) =>
      a.departement.localeCompare(b.departement) || a.ville.localeCompare(b.ville)
    );
  }

  isZoneSelected(zone: GeographicalZoneOption): boolean {
    return this.request.zones.some((selected) => this.zoneKey(selected) === this.zoneKey(zone));
  }

  toggleZone(zone: GeographicalZoneOption) {
    if (!this.isEditing) {
      return;
    }

    this.request.zones = this.isZoneSelected(zone)
      ? this.request.zones.filter((selected) => this.zoneKey(selected) !== this.zoneKey(zone))
      : [...this.request.zones, { ...zone }];
  }

  clearZones() {
    if (!this.isEditing) {
      return;
    }

    this.request.zones = [];
  }

  /**
   * An arrow property, not a method: ngFor calls trackBy unbound, so a plain method
   * would lose `this` and fail on zoneKey.
   */
  trackByZone = (_: number, item: { departement: string; ville: string }) => this.zoneKey(item);

  addMedia(mediaType: 'CD' | 'Video') {
    if (!this.isEditing) {
      return;
    }

    this.request.media = [
      ...this.request.media,
      {
        media_type: mediaType,
        image_url: null,
        name: '',
        description: '',
        url: '',
        copyright_text: '',
      },
    ];
  }

  removeMedia(index: number) {
    if (!this.isEditing) {
      return;
    }

    this.request.media = this.request.media.filter((_, itemIndex) => itemIndex !== index);
  }

  removeArtistSelection(index: number) {
    if (!this.isEditing) {
      return;
    }

    if (this.request.artists[index]?.is_primary) {
      return;
    }

    this.request.artists = this.request.artists.filter((_, itemIndex) => itemIndex !== index);
  }

  /** TJS artists not already on the request — the primary artist included. */
  get availableTjsArtists() {
    return this.tjsArtists.filter(
      (option) => !this.request.artists.some((artist) => artist.artist_id === option.id)
    );
  }

  get availableInvitedArtists(): InvitedArtistOption[] {
    return this.invitedArtistOptions.filter((option) => !this.isArtistOnRequest(option.id, option.email));
  }

  get availablePagArtists(): PagArtistOption[] {
    return this.pagArtistOptions.filter(
      (option) => !this.isArtistOnRequest(option.tjs_artist_id, option.email)
        && !this.request.artists.some((artist) => artist.pag_artist_id === option.pag_artist_id)
    );
  }

  /** True once this person sits on the request, by artist record or by email. */
  private isArtistOnRequest(artistId: string | null, email: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();

    return this.request.artists.some((artist) => {
      if (artistId && (artist.artist_id === artistId || artist.invited_artist_id === artistId)) {
        return true;
      }

      return !!normalizedEmail && artist.invited_email.trim().toLowerCase() === normalizedEmail;
    });
  }

  addTjsArtist() {
    const selected = this.tjsArtists.find((artist) => artist.id === this.selectedTjsArtistId);
    if (!this.isEditing || !selected) {
      return;
    }

    this.request.artists = [
      ...this.request.artists,
      {
        artist_id: selected.id,
        invited_artist_id: null,
        invited_email: '',
        display_name: selected.artist_name,
        invited_full_name: '',
        is_primary: false,
      },
    ];
    this.selectedTjsArtistId = '';
  }

  /** Adds an artist who was invited before: they exist already, so no new invitation is sent. */
  addExistingInvitedArtist() {
    const selected = this.invitedArtistOptions.find((artist) => artist.id === this.selectedInvitedArtistId);
    if (!this.isEditing || !selected) {
      return;
    }

    this.request.artists = [
      ...this.request.artists,
      {
        artist_id: null,
        invited_artist_id: selected.id,
        invited_email: selected.email,
        display_name: selected.artist_name,
        invited_full_name: selected.artist_name,
        is_primary: false,
      },
    ];
    this.selectedInvitedArtistId = '';
  }

  /** Queues a PAG artist; the invitation and the PAG flag are applied on submit. */
  addPagArtist() {
    const selected = this.pagArtistOptions.find((artist) => artist.pag_artist_id === this.selectedPagArtistId);
    if (!this.isEditing || !selected) {
      return;
    }

    this.request.artists = [
      ...this.request.artists,
      {
        artist_id: null,
        invited_artist_id: null,
        invited_email: selected.email,
        display_name: selected.full_name,
        invited_full_name: selected.full_name,
        pag_artist_id: selected.pag_artist_id,
        is_primary: false,
      },
    ];
    this.selectedPagArtistId = '';
  }

  /** What a row is, for its badge and for grouping. */
  artistKind(artist: ArtistRequestArtistEntry): 'primary' | 'tjs' | 'pag' | 'invited' {
    if (artist.is_primary) {
      return 'primary';
    }

    // pag_artist_id while the pick is still queued; is_pag_artist once it has been saved.
    if (artist.pag_artist_id || artist.is_pag_artist) {
      return 'pag';
    }

    return artist.artist_id ? 'tjs' : 'invited';
  }

  get coArtists(): ArtistRequestArtistEntry[] {
    return this.request.artists.filter((artist) => !artist.is_primary);
  }

  /** Removes by identity: the list shown skips the primary artist, so indexes would not line up. */
  removeCoArtist(artist: ArtistRequestArtistEntry) {
    if (!this.isEditing || artist.is_primary) {
      return;
    }

    this.request.artists = this.request.artists.filter((item) => item !== artist);
  }

  trackByArtistOption(_: number, item: { id: string }) {
    return item.id;
  }

  trackByInvitedOption(_: number, item: InvitedArtistOption) {
    return item.id;
  }

  trackByPagOption(_: number, item: PagArtistOption) {
    return item.pag_artist_id;
  }

  async onRequestImageSelected(event: Event) {
    if (!this.isEditing) {
      return;
    }

    const profileId = this.authService.currentUser?.id;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!profileId || !file) {
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
    if (!this.isEditing) {
      return;
    }

    const profileId = this.authService.currentUser?.id;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!profileId || !file) {
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

  async submitRequest() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Request could not be submitted.';
      return;
    }

    if (this.request.id && this.isPublishedRequestLocked()) {
      this.error = 'Published requests cannot be edited.';
      return;
    }

    this.error = '';
    this.successMessage = '';

    if (!this.request.event_title.trim()) {
      this.error = 'Event title is required.';
      this.activeTab = 'details';
      return;
    }

    // Catches a request drafted before the domain list had loaded.
    if (this.frozenEventDomain && !this.request.event_domain_id) {
      this.request.event_domain_id = this.frozenEventDomain.id;
    }

    this.artistInstruments = await this.supabase.getArtistWorkspaceInstruments(profileId);
    if (this.artistInstruments.length === 0) {
      this.error = 'Add at least one instrument to your profile before submitting an event request.';
      return;
    }

    const datesValidationError = validateArtistRequestDates(this.request.dates);
    if (datesValidationError) {
      this.error = datesValidationError;
      this.activeTab = 'dates';
      return;
    }

    const isNewRequestSubmission = !this.request.id;
    const datesChanged = !isNewRequestSubmission
      && this.buildDatesSignature(this.request.dates) !== this.originalDatesSignature;

    // Artist Proposed only ever follows Host Proposed — it is the artist's counter to a
    // host proposal. Until a host proposes, the request stays a New Request however much
    // the artists on it edit: creator, TJS artists or invited artists alike.
    const isCounterToHostProposal = this.request.status === 'host_proposed';

    if (datesChanged && isCounterToHostProposal) {
      this.request.status = 'artist_proposed';
      this.isSubmittingArtistProposal = true;
    }

    this.isSaving = true;
    const result = await this.supabase.saveArtistWorkspaceRequest(profileId, this.request);
    if (result.error || !result.requestId) {
      this.error = result.error ?? 'Request could not be submitted.';
      this.isSaving = false;
      return;
    }

    this.selectedRequestId = result.requestId;
    if (isNewRequestSubmission) {
      const requestDateLines = this.request.dates.map((date) =>
        date.request_type === 'period'
          ? `- Period | ${date.start_date} to ${date.end_date || 'TBD'}${date.event_time ? ` | ${date.event_time}` : ''}`
          : `- One Day | ${date.start_date}${date.event_time ? ` | ${date.event_time}` : ''}`
      );
      const datesCommentError = await this.supabase.addArtistWorkspaceRequestComment(
        result.requestId,
        profileId,
        ['[ARTIST_REQUEST_DATES]', 'Artist proposed dates:', ...requestDateLines].join('\n')
      );

      if (datesCommentError) {
        this.error = datesCommentError;
        this.isSaving = false;
        return;
      }
    }

    const initialComment = this.initialCommentPreview || this.commentDraft.trim();
    if (initialComment) {
      const commentError = await this.supabase.addArtistWorkspaceRequestComment(result.requestId, profileId, initialComment);
      if (commentError) {
        this.error = commentError;
        this.isSaving = false;
        return;
      }
    }

    const pendingInvites = this.request.artists.filter(
      (item) => !item.artist_id && !item.invited_artist_id && item.invited_email.trim() && (item.invited_full_name || item.display_name).trim()
    );

    for (const invite of pendingInvites) {
      const fullName = invite.invited_full_name?.trim() || invite.display_name.trim();

      // A PAG co-artist is invited the same way, then flagged with their PAG record.
      const inviteResult = invite.pag_artist_id
        ? await this.supabase.invitePagArtistForRequest(profileId, result.requestId, {
            pag_artist_id: invite.pag_artist_id,
            email: invite.invited_email,
            full_name: fullName,
          })
        : await this.supabase.inviteArtistForRequest(
            profileId,
            result.requestId,
            invite.invited_email,
            fullName
          );

      if (inviteResult.error) {
        this.error = inviteResult.error;
        this.isSaving = false;
        return;
      }
    }

    const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(result.requestId);
    if (refreshed) {
      this.request = this.applyPrimaryArtist(refreshed);
      this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
    } else {
      this.request.id = result.requestId;
      this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
    }

    if (this.isSubmittingArtistProposal) {
      const proposedDateLines = this.request.dates.map((date) =>
        date.request_type === 'period'
          ? `- Period | ${date.start_date} to ${date.end_date || 'TBD'}${date.event_time ? ` | ${date.event_time}` : ''}`
          : `- One Day | ${date.start_date}${date.event_time ? ` | ${date.event_time}` : ''}`
      );
      const proposalCommentError = await this.supabase.addArtistWorkspaceRequestComment(
        result.requestId,
        profileId,
        ['[ARTIST_PROPOSED]', 'Artist proposed new dates:', ...proposedDateLines].join('\n')
      );

      if (proposalCommentError) {
        this.error = proposalCommentError;
        this.isSaving = false;
        return;
      }

      const proposalRefreshed = await this.supabase.getArtistWorkspaceRequestDetail(result.requestId);
      if (proposalRefreshed) {
        this.request = this.applyPrimaryArtist(proposalRefreshed);
        this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
      }
    }

    this.successMessage = this.isSubmittingArtistProposal
      ? 'New proposed dates sent to the host.'
      : 'Request submitted successfully.';
    this.isSaving = false;
    this.isSubmittingArtistProposal = false;
    this.isEditing = false;
    await this.loadRequests(profileId);
    await this.router.navigate(['/backoffice/artist-requests', result.requestId]);
  }

  async addComment() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Comment could not be added.';
      return;
    }

    if (!this.commentDraft.trim()) {
      this.error = 'Comment is required.';
      return;
    }

    if (!this.request.id) {
      this.initialCommentPreview = this.commentDraft.trim();
      this.commentDraft = '';
      this.successMessage = 'Initial comment added to the request.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isAddingComment = true;

    const error = await this.supabase.addArtistWorkspaceRequestComment(this.request.id, profileId, this.commentDraft);
    if (error) {
      this.error = error;
      this.isAddingComment = false;
      return;
    }

    const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(this.request.id);
    if (refreshed) {
      this.request = refreshed;
    }
    this.commentDraft = '';
    this.successMessage = 'Comment added.';
    this.isAddingComment = false;
  }

  async inviteAdditionalArtist() {
    if (!this.inviteArtist.email.trim() || !this.inviteArtist.fullName.trim()) {
      this.error = 'Invite artist email and full name are required.';
      return;
    }

    const normalizedEmail = this.inviteArtist.email.trim().toLowerCase();
    const normalizedName = this.inviteArtist.fullName.trim();

    if (this.request.id) {
      const profileId = this.authService.currentUser?.id;
      if (!profileId) {
        this.error = 'Invite artist could not be sent.';
        return;
      }

      const result = await this.supabase.inviteArtistForRequest(
        profileId,
        this.request.id,
        normalizedEmail,
        normalizedName
      );

      if (result.error) {
        this.error = result.error;
        return;
      }

      const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(this.request.id);
      if (refreshed) {
        this.request = this.applyPrimaryArtist(refreshed);
      }

      this.inviteArtist = { email: '', fullName: '' };
      this.showInviteArtistForm = false;
      this.successMessage = `Invitation sent to ${normalizedEmail}.`;
      return;
    }

    this.request.artists = [
      ...this.request.artists,
      {
        artist_id: null,
        invited_artist_id: null,
        invited_email: normalizedEmail,
        display_name: normalizedName,
        invited_full_name: normalizedName,
        is_primary: false,
      },
    ];

    this.inviteArtist = { email: '', fullName: '' };
    this.showInviteArtistForm = false;
    this.successMessage = 'Invite added to the request. It will be sent on submit.';
  }

  charsLeft(text: string | null | undefined, maxLength: number): number {
    return remainingCharacters(text, maxLength);
  }

  trackByRequest(_: number, item: ArtistRequestListItem) {
    return item.id;
  }

  /** The status as it reads on screen, so searching for "Host Proposed" finds it. */
  statusLabel(status: ArtistRequestListItem['status']): string {
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
      default:
        return status;
    }
  }

  /** Free-text search over the columns the table shows. */
  get filteredRequests(): ArtistRequestListItem[] {
    const search = this.requestSearch.trim().toLowerCase();
    if (!search) {
      return this.requests;
    }

    return this.requests.filter((request) => [
      request.event_title,
      request.event_domain_name,
      request.date_summary,
      this.statusLabel(request.status),
      request.status,
    ].some((field) => (field ?? '').toLowerCase().includes(search)));
  }

  trackByMedia(index: number, item: ArtistRequestMediaEntry) {
    return item.id ?? `${item.media_type}-${index}`;
  }

  trackByArtist(index: number, item: ArtistRequestArtistEntry) {
    return item.id ?? item.artist_id ?? item.invited_artist_id ?? `${index}`;
  }

  trackByComment(_: number, item: ArtistRequestCommentEntry) {
    return item.id;
  }

  formatArtistOptionLabel(artist: { artist_name: string; instruments: string[] }): string {
    if (!artist.instruments.length) {
      return artist.artist_name;
    }

    return `${artist.artist_name} - (${artist.instruments.join(', ')})`;
  }

  hasUnreadComments(request: ArtistRequestListItem): boolean {
    if (!this.currentProfileId || !request.latest_comment_at) {
      return false;
    }

    if (request.latest_comment_author_profile_id === this.currentProfileId) {
      return false;
    }

    const seenAt = this.seenCommentMap[request.id];
    return !seenAt || new Date(request.latest_comment_at).getTime() > new Date(seenAt).getTime();
  }

  get invitedArtists() {
    // The primary artist is never listed as an invited one, whatever their row holds.
    return this.request.artists.filter((artist) => !artist.is_primary && this.isInvitedArtist(artist));
  }

  get additionalArtists() {
    return this.request.artists.filter((artist) => !artist.is_primary && !this.isInvitedArtist(artist));
  }

  get selectedDomainName(): string {
    return this.eventDomains.find((domain) => domain.id === this.request.event_domain_id)?.name ?? 'Not selected';
  }

  /**
   * The domain the field is pinned to. Matched by name so it survives whatever id the
   * row carries, and loosely enough to catch it in either language: "Musique Classique",
   * "Classical Music", "Classical Musiq".
   */
  get frozenEventDomain(): { id: number; name: string } | null {
    const normalize = (value: string) => value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

    const target = normalize(ArtistRequests.FROZEN_EVENT_DOMAIN_NAME);

    return this.eventDomains.find((domain) => normalize(domain.name) === target)
      ?? this.eventDomains.find((domain) => {
        const name = normalize(domain.name);
        return name.includes('classi') && name.includes('musi');
      })
      ?? null;
  }

  get isEventDomainFrozen(): boolean {
    return !!this.frozenEventDomain;
  }

  isInvitedArtist(artist: ArtistRequestArtistEntry): boolean {
    return !!artist.invited_email || (!!artist.invited_artist_id && !artist.artist_id);
  }

  get latestHostProposal(): HostProposalSummary | null {
    const hostAcceptedComment = [...this.request.comments]
      .reverse()
      .find((comment) => comment.body.startsWith('[HOST_PROPOSED]') || comment.body.startsWith('[HOST_ACCEPTED]'));

    if (!hostAcceptedComment) {
      return null;
    }

    const lines = hostAcceptedComment.body.split('\n').map((line) => line.trim()).filter(Boolean);
    const editionLine = lines.find((line) => line.startsWith('Edition:'));
    const eventTypeLine = lines.find((line) => line.startsWith('Event Type:'));
    const proposedDateIndex = lines.findIndex((line) => line === 'Proposed Dates:');

    return {
      edition: editionLine ? editionLine.replace('Edition:', '').trim() : null,
      eventType: eventTypeLine ? eventTypeLine.replace('Event Type:', '').trim() : null,
      dateLines: proposedDateIndex >= 0
        ? lines.slice(proposedDateIndex + 1).map((line) => line.replace(/^- /, '').trim()).filter(Boolean)
        : [],
      rawBody: hostAcceptedComment.body,
    };
  }

  get sortedComments(): ArtistRequestCommentEntry[] {
    return [...this.request.comments].reverse();
  }

  get canRespondToHostProposal(): boolean {
    return !!this.request.id && this.request.status === 'host_proposed' && !this.isEditing;
  }

  isPublishedRequestLocked(): boolean {
    return !!this.request.id && this.request.status === 'published';
  }

  /** Tabs actually on screen — Proposed Dates only exists once a host has proposed. */
  get visibleTabs(): RequestTab[] {
    const tabs: RequestTab[] = ['details', 'dates', 'zones'];

    if (this.latestHostProposal && this.request.status !== 'published') {
      tabs.push('proposed_dates');
    }

    return [...tabs, 'image', 'media', 'artist', 'comments'];
  }

  tabLabel(tab: RequestTab): string {
    switch (tab) {
      case 'details':
        return 'Details';
      case 'dates':
        return 'Dates';
      case 'zones':
        return 'Geographical Zone';
      case 'proposed_dates':
        return 'Proposed Dates';
      case 'image':
        return 'Image';
      case 'media':
        return 'Media';
      case 'artist':
        return 'Artist';
      default:
        return 'Comments';
    }
  }

  private get activeTabIndex(): number {
    return this.visibleTabs.indexOf(this.activeTab);
  }

  get previousTab(): RequestTab | null {
    return this.visibleTabs[this.activeTabIndex - 1] ?? null;
  }

  get nextTab(): RequestTab | null {
    return this.visibleTabs[this.activeTabIndex + 1] ?? null;
  }

  get isLastTab(): boolean {
    return this.nextTab === null;
  }

  goToPreviousTab() {
    if (this.previousTab) {
      this.activeTab = this.previousTab;
    }
  }

  goToNextTab() {
    if (this.nextTab) {
      this.activeTab = this.nextTab;
    }
  }

  /** False when the open request was created by another artist who invited this one onto it. */
  get isRequestOwner(): boolean {
    if (!this.request.id || !this.request.created_by) {
      return true;
    }

    return this.request.created_by === this.currentProfileId;
  }

  canEditSelectedRequest(): boolean {
    if (!this.request.id) {
      return true;
    }

    return canEditArtistRequest(this.request.status, this.isRequestOwner);
  }

  /** Explains why the editor is locked, so an invited artist is not left guessing. */
  get requestLockReason(): string {
    if (!this.request.id || this.canEditSelectedRequest()) {
      return '';
    }

    return this.isRequestOwner ? 'Published requests cannot be edited.' : COLLABORATOR_LOCKED_MESSAGE;
  }

  async acceptHostProposal() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request.id) {
      this.error = 'Request could not be approved.';
      return;
    }

    const hostProposalDates = this.latestHostProposal?.dateLines ?? [];
    const artistDatesError = validateArtistRequestDates(this.request.dates);
    if (hostProposalDates.length === 0 && artistDatesError) {
      this.error = 'Cannot accept this proposal without proposed dates.';
      this.activeTab = 'proposed_dates';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const statusError = await this.supabase.updateArtistWorkspaceRequestStatus(profileId, this.request.id, 'approved');
    if (statusError) {
      this.error = statusError;
      this.isSaving = false;
      return;
    }

    const commentError = await this.supabase.addArtistWorkspaceRequestComment(
      this.request.id,
      profileId,
      '[ARTIST_APPROVED]\nArtist accepted the host proposal.'
    );

    if (commentError) {
      this.error = commentError;
      this.isSaving = false;
      return;
    }

    await this.refreshCurrentRequest();
    await this.loadRequests(profileId);
    this.successMessage = 'Host proposal accepted.';
    this.isSaving = false;
  }

  proposeNewDates() {
    this.error = '';
    this.successMessage = 'Update your request dates and submit again to propose new dates.';
    this.request.status = 'artist_proposed';
    this.isSubmittingArtistProposal = true;
    this.isEditing = true;
    this.activeTab = 'dates';
  }

  private blankRequest(): ArtistRequestDetail {
    return this.applyPrimaryArtist({
      event_domain_id: this.frozenEventDomain?.id ?? null,
      event_title: '',
      teaser: '',
      long_teaser: '',
      description: '',
      image_url: null,
      image_copyright: '',
      status: 'new_request',
      dates: [this.blankDate()],
      zones: [],
      media: [],
      artists: [],
      comments: [],
    });
  }

  dateTypeLabel(date: ArtistRequestDateEntry): string {
    if (date.is_residence) {
      return 'Residence';
    }

    return date.request_type === 'period' ? 'Period' : 'Day Show';
  }

  /** Readable day for the card summary; falls back to a dash while the field is empty. */
  formatDateLabel(value: string | null | undefined): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      return '—';
    }

    const parsed = new Date(`${trimmed}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return trimmed;
    }

    return parsed.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  dateRangeLabel(date: ArtistRequestDateEntry): string {
    const start = this.formatDateLabel(date.start_date);

    if (date.request_type !== 'period') {
      return start;
    }

    return `${start} → ${this.formatDateLabel(date.end_date)}`;
  }

  /** Inclusive length of a period, shown next to the range. Null when it cannot be worked out. */
  periodDayCount(date: ArtistRequestDateEntry): number | null {
    if (date.request_type !== 'period' || !date.start_date?.trim() || !date.end_date?.trim()) {
      return null;
    }

    const start = new Date(`${date.start_date}T00:00:00`).getTime();
    const end = new Date(`${date.end_date}T00:00:00`).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return null;
    }

    return Math.round((end - start) / 86_400_000) + 1;
  }

  /** True once the row has everything it needs to be submitted. */
  isDateComplete(date: ArtistRequestDateEntry): boolean {
    if (!date.start_date?.trim()) {
      return false;
    }

    return date.request_type !== 'period' || !!date.end_date?.trim();
  }

  private blankDate(): ArtistRequestDateEntry {
    return {
      request_type: 'day_show',
      is_residence: false,
      start_date: '',
      end_date: '',
      event_time: '',
    };
  }

  /** A residence is always a period, whatever an older row may have stored. */
  private normalizeRequestDates(dates: ArtistRequestDateEntry[]): ArtistRequestDateEntry[] {
    return dates.map((date) => (
      date.is_residence ? { ...date, request_type: 'period' as const } : date
    ));
  }

  private async loadData(profileId: string) {
    try {
      const [
        requests,
        eventDomains,
        geographicalZones,
        tjsArtists,
        invitedArtistOptions,
        pagArtistOptions,
        artistInstruments,
      ] = await Promise.all([
        this.supabase.getArtistWorkspaceRequests(profileId),
        this.supabase.listEventDomains(),
        this.supabase.listGeographicalZones(),
        this.supabase.listTjsArtistsForRequestSelection(),
        this.supabase.listInvitedArtistsForRequestSelection(),
        this.supabase.listPagArtistsForRequestSelection(),
        this.supabase.getArtistWorkspaceInstruments(profileId),
      ]);

      this.requests = requests;
      this.eventDomains = eventDomains;
      this.geographicalZones = geographicalZones;
      this.tjsArtists = tjsArtists;
      this.invitedArtistOptions = invitedArtistOptions;
      this.pagArtistOptions = pagArtistOptions;
      this.artistInstruments = artistInstruments;
      const currentArtist = this.tjsArtists.find((artist) => artist.profile_id === profileId) ?? null;
      this.currentArtistId = currentArtist?.id ?? null;
      this.currentArtistName = currentArtist?.artist_name ?? this.authService.currentUser?.email ?? '';
      this.request = this.blankRequest();
      this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist requests could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadRequests(profileId: string) {
    this.requests = await this.supabase.getArtistWorkspaceRequests(profileId);
  }

  private async refreshCurrentRequest() {
    if (!this.request.id) {
      return;
    }

    const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(this.request.id);
    if (!refreshed) {
      return;
    }

    this.request = this.applyPrimaryArtist(refreshed);
    this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
  }

  private async syncEditorWithRoute() {
    if (!this.currentProfileId) {
      return;
    }

    const urlPath = this.router.url.split('?')[0];
    const isNewRoute = urlPath.endsWith('/artist-requests/new');
    const requestId = this.route.snapshot.paramMap.get('requestId');

    if (isNewRoute) {
      this.prepareNewRequest();
      return;
    }

    if (requestId) {
      await this.loadExistingRequest(requestId);
      return;
    }

    this.resetEditorState();
  }

  private loadSeenCommentMap(profileId: string) {
    try {
      const raw = localStorage.getItem(`artist-request-comments-seen:${profileId}`);
      this.seenCommentMap = raw ? JSON.parse(raw) : {};
    } catch {
      this.seenCommentMap = {};
    }
  }

  private markRequestCommentsAsSeen(requestId: string, latestCommentAt: string | null) {
    if (!this.currentProfileId || !latestCommentAt) {
      return;
    }

    this.seenCommentMap = {
      ...this.seenCommentMap,
      [requestId]: latestCommentAt,
    };

    try {
      localStorage.setItem(
        `artist-request-comments-seen:${this.currentProfileId}`,
        JSON.stringify(this.seenCommentMap)
      );
    } catch {
      // ignore localStorage failures
    }
  }

  private applyPrimaryArtist(request: ArtistRequestDetail): ArtistRequestDetail {
    // On a saved request the primary artist is whoever created it — never whoever
    // happens to be logged in. An invited artist opening the request must still see
    // the creator as the primary artist, and themselves as invited.
    if (request.id && request.created_by) {
      const artists = request.artists.map((artist) => ({
        ...artist,
        is_primary: !!artist.profile_id && artist.profile_id === request.created_by,
      }));

      if (!artists.some((artist) => artist.is_primary)) {
        return { ...request, artists };
      }

      return {
        ...request,
        artists: [
          ...artists.filter((artist) => artist.is_primary),
          ...artists.filter((artist) => !artist.is_primary),
        ],
      };
    }

    // A request being created: the artist writing it is the primary artist.
    if (!this.currentArtistId) {
      return request;
    }

    const otherArtists = request.artists.filter((artist) => artist.artist_id !== this.currentArtistId);
    const existingPrimary = request.artists.find((artist) => artist.artist_id === this.currentArtistId);

    return {
      ...request,
      artists: [
        {
          id: existingPrimary?.id,
          artist_id: this.currentArtistId,
          invited_artist_id: null,
          invited_email: '',
          display_name: existingPrimary?.display_name || this.currentArtistName || 'Primary Artist',
          invited_full_name: '',
          is_primary: true,
        },
        ...otherArtists.map((artist) => ({
          ...artist,
          is_primary: false,
        })),
      ],
    };
  }

  private buildDatesSignature(dates: ArtistRequestDateEntry[]): string {
    return JSON.stringify(
      dates.map((date) => ({
        request_type: date.request_type,
        start_date: date.start_date || '',
        end_date: date.end_date || '',
        event_time: date.event_time || '',
      }))
    );
  }

  private readDuplicateDraftFromRouteState(): ArtistRequestDetail | null {
    const navigationState = (this.router.getCurrentNavigation()?.extras.state
      ?? window.history.state) as Record<string, unknown> | null;
    const rawDraft = navigationState?.[ArtistRequests.DUPLICATE_DRAFT_STATE_KEY];

    if (!rawDraft || typeof rawDraft !== 'object') {
      return null;
    }

    return rawDraft as ArtistRequestDetail;
  }

}
