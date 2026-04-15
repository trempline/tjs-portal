import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistRequestArtistEntry,
  ArtistRequestCommentEntry,
  ArtistRequestDateEntry,
  ArtistRequestDetail,
  ArtistRequestListItem,
  ArtistRequestMediaEntry,
  SupabaseService,
} from '../../services/supabase.service';

type RequestTab = 'details' | 'dates' | 'proposed_dates' | 'image' | 'media' | 'artist' | 'comments';

interface HostProposalSummary {
  edition: string | null;
  eventType: string | null;
  dateLines: string[];
  rawBody: string;
}

@Component({
  selector: 'app-artist-requests',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe, RouterLink],
  templateUrl: './artist-requests.html',
})
export class ArtistRequests implements OnInit {
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

  requests: ArtistRequestListItem[] = [];
  eventDomains: Array<{ id: number; name: string }> = [];
  tjsArtists: Array<{ id: string; artist_name: string; profile_id: string; instruments: string[] }> = [];

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

  async openNewRequest() {
    await this.router.navigate(['/backoffice/artist-requests/new']);
  }

  private prepareNewRequest() {
    this.error = '';
    this.successMessage = '';
    this.isEditorOpen = true;
    this.isDetailLoading = false;
    this.activeTab = 'details';
    this.selectedRequestId = null;
    this.request = this.blankRequest();
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.inviteArtist = { email: '', fullName: '' };
    this.showInviteArtistForm = false;
    this.isSubmittingArtistProposal = false;
    this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
    this.isEditing = true;
  }

  async openExistingRequest(requestId: string) {
    await this.router.navigate(['/backoffice/artist-requests', requestId]);
  }

  private async loadExistingRequest(requestId: string) {
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
    this.isSubmittingArtistProposal = false;

    const detail = await this.supabase.getArtistWorkspaceRequestDetail(requestId);
    if (!detail) {
      this.error = 'Request details could not be loaded.';
      this.isDetailLoading = false;
      return;
    }

    this.request = this.applyPrimaryArtist(detail);
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
    this.isSubmittingArtistProposal = false;
    this.originalDatesSignature = this.buildDatesSignature(this.request.dates);
  }

  startEditing() {
    if (!this.request.id) {
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
    this.showInviteArtistForm = false;
    this.request = this.applyPrimaryArtist({
      ...detail,
      id: undefined,
      event_title: `${detail.event_title}_COPY`,
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
      dates: detail.dates.map((date) => ({
        ...date,
        id: undefined,
      })),
    });

    await this.router.navigate(['/backoffice/artist-requests/new']);
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
    if (!profileId || !this.request.id) {
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
    return !!this.request.id && this.request.status !== 'approved';
  }

  addDate() {
    if (!this.isEditing) {
      return;
    }

    this.request.dates = [...this.request.dates, this.blankDate()];
  }

  removeDate(index: number) {
    if (!this.isEditing) {
      return;
    }

    this.request.dates = this.request.dates.filter((_, itemIndex) => itemIndex !== index);
  }

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
      },
    ];
  }

  removeMedia(index: number) {
    if (!this.isEditing) {
      return;
    }

    this.request.media = this.request.media.filter((_, itemIndex) => itemIndex !== index);
  }

  addArtistSelection() {
    if (!this.isEditing) {
      return;
    }

    this.request.artists = [
      ...this.request.artists,
      {
        artist_id: null,
        invited_artist_id: null,
        invited_email: '',
        display_name: '',
        invited_full_name: '',
        is_primary: false,
      },
    ];
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

  onArtistSelected(index: number) {
    const item = this.request.artists[index];
    const selected = this.tjsArtists.find((artist) => artist.id === item.artist_id);
    if (!selected) {
      return;
    }

    this.request.artists[index] = {
      ...item,
      invited_artist_id: null,
      invited_email: '',
      display_name: selected.artist_name,
      invited_full_name: '',
    };
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

    this.error = '';
    this.successMessage = '';

    if (!this.request.event_title.trim()) {
      this.error = 'Event title is required.';
      this.activeTab = 'details';
      return;
    }

    if (this.request.dates.length === 0) {
      this.error = 'At least one date entry is required.';
      this.activeTab = 'dates';
      return;
    }

    for (const date of this.request.dates) {
      if (!date.start_date) {
        this.error = 'Start date is required for every date entry.';
        this.activeTab = 'dates';
        return;
      }

      if (date.request_type === 'period' && !date.end_date) {
        this.error = 'End date is required for every period entry.';
        this.activeTab = 'dates';
        return;
      }
    }

    const isNewRequestSubmission = !this.request.id;
    const datesChanged = !isNewRequestSubmission
      && this.buildDatesSignature(this.request.dates) !== this.originalDatesSignature;

    if (datesChanged) {
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
      const inviteResult = await this.supabase.inviteArtistForRequest(
        profileId,
        result.requestId,
        invite.invited_email,
        invite.invited_full_name?.trim() || invite.display_name.trim()
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

  trackByRequest(_: number, item: ArtistRequestListItem) {
    return item.id;
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
    return this.request.artists.filter((artist) => this.isInvitedArtist(artist));
  }

  get additionalArtists() {
    return this.request.artists.filter((artist) => !artist.is_primary && !this.isInvitedArtist(artist));
  }

  get selectedDomainName(): string {
    return this.eventDomains.find((domain) => domain.id === this.request.event_domain_id)?.name ?? 'Not selected';
  }

  isInvitedArtist(artist: ArtistRequestArtistEntry): boolean {
    return !!artist.invited_email || (!!artist.invited_artist_id && !artist.artist_id);
  }

  get latestHostProposal(): HostProposalSummary | null {
    const hostAcceptedComment = [...this.request.comments]
      .reverse()
      .find((comment) => comment.body.startsWith('[HOST_ACCEPTED]'));

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

  async acceptHostProposal() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request.id) {
      this.error = 'Request could not be approved.';
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
      event_domain_id: null,
      event_title: '',
      teaser: '',
      long_teaser: '',
      description: '',
      image_url: null,
      status: 'new_request',
      dates: [this.blankDate()],
      media: [],
      artists: [],
      comments: [],
    });
  }

  private blankDate(): ArtistRequestDateEntry {
    return {
      request_type: 'day_show',
      start_date: '',
      end_date: '',
      event_time: '',
    };
  }

  private async loadData(profileId: string) {
    try {
      const [requests, eventDomains, tjsArtists] = await Promise.all([
        this.supabase.getArtistWorkspaceRequests(profileId),
        this.supabase.listEventDomains(),
        this.supabase.listTjsArtistsForRequestSelection(),
      ]);

      this.requests = requests;
      this.eventDomains = eventDomains;
      this.tjsArtists = tjsArtists;
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

    const routePath = this.route.snapshot.routeConfig?.path;
    const requestId = this.route.snapshot.paramMap.get('requestId');

    if (routePath === 'artist-requests/new') {
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
}
