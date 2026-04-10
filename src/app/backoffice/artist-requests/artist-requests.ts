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

type RequestTab = 'details' | 'dates' | 'image' | 'media' | 'artist' | 'comments';

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

  isLoading = true;
  isSaving = false;
  isRequestImageUploading = false;
  isEditing = false;
  error = '';
  successMessage = '';

  requests: ArtistRequestListItem[] = [];
  eventDomains: Array<{ id: number; name: string }> = [];
  tjsArtists: Array<{ id: string; artist_name: string; profile_id: string }> = [];

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
    this.activeTab = 'details';
    this.selectedRequestId = null;
    this.request = this.blankRequest();
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.inviteArtist = { email: '', fullName: '' };
    this.showInviteArtistForm = false;
    this.isEditing = true;
  }

  async openExistingRequest(requestId: string) {
    await this.router.navigate(['/backoffice/artist-requests', requestId]);
  }

  private async loadExistingRequest(requestId: string) {
    this.error = '';
    this.successMessage = '';
    this.isEditorOpen = true;
    this.activeTab = 'details';
    this.selectedRequestId = requestId;
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.inviteArtist = { email: '', fullName: '' };
    this.showInviteArtistForm = false;

    const detail = await this.supabase.getArtistWorkspaceRequestDetail(requestId);
    if (!detail) {
      this.error = 'Request details could not be loaded.';
      return;
    }

    this.request = this.applyPrimaryArtist(detail);
    this.markRequestCommentsAsSeen(requestId, detail.comments.at(-1)?.created_at ?? null);
    this.isEditing = false;
  }

  async closeEditor() {
    await this.router.navigate(['/backoffice/artist-requests']);
  }

  private resetEditorState() {
    this.isEditorOpen = false;
    this.selectedRequestId = null;
    this.request = this.blankRequest();
    this.isEditing = false;
    this.commentDraft = '';
    this.initialCommentPreview = '';
    this.showInviteArtistForm = false;
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
      status: 'pending',
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

  async deleteRequest() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request.id) {
      this.error = 'Request could not be deleted.';
      return;
    }

    const deleteError = await this.supabase.deleteArtistWorkspaceRequest(profileId, this.request.id);
    if (deleteError) {
      this.error = deleteError;
      return;
    }

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

    this.isSaving = true;
    const result = await this.supabase.saveArtistWorkspaceRequest(profileId, this.request);
    if (result.error || !result.requestId) {
      this.error = result.error ?? 'Request could not be submitted.';
      this.isSaving = false;
      return;
    }

    this.selectedRequestId = result.requestId;
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
    } else {
      this.request.id = result.requestId;
    }

    this.successMessage = 'Request submitted successfully.';
    this.isSaving = false;
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

    const error = await this.supabase.addArtistWorkspaceRequestComment(this.request.id, profileId, this.commentDraft);
    if (error) {
      this.error = error;
      return;
    }

    const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(this.request.id);
    if (refreshed) {
      this.request = refreshed;
    }
    this.commentDraft = '';
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

  private blankRequest(): ArtistRequestDetail {
    return this.applyPrimaryArtist({
      event_domain_id: null,
      event_title: '',
      teaser: '',
      long_teaser: '',
      description: '',
      image_url: null,
      status: 'pending',
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
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist requests could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadRequests(profileId: string) {
    this.requests = await this.supabase.getArtistWorkspaceRequests(profileId);
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
}
