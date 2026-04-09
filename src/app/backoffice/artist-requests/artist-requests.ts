import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ArtistRequestArtistEntry,
  ArtistRequestCommentEntry,
  ArtistRequestDetail,
  ArtistRequestListItem,
  ArtistRequestMediaEntry,
  SupabaseService,
} from '../../services/supabase.service';

type RequestTab = 'details' | 'dates' | 'image' | 'media' | 'artist' | 'comments';

@Component({
  selector: 'app-artist-requests',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './artist-requests.html',
})
export class ArtistRequests implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  isRequestImageUploading = false;
  error = '';
  successMessage = '';

  requests: ArtistRequestListItem[] = [];
  eventDomains: Array<{ id: number; name: string }> = [];
  tjsArtists: Array<{ id: string; artist_name: string; profile_id: string }> = [];

  isEditorOpen = false;
  activeTab: RequestTab = 'details';
  selectedRequestId: string | null = null;
  commentDraft = '';

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

    await this.loadData(profileId);
  }

  get pendingRequests(): ArtistRequestListItem[] {
    return this.requests.filter((item) => item.status === 'pending');
  }

  get approvedRequests(): ArtistRequestListItem[] {
    return this.requests.filter((item) => item.status === 'approved');
  }

  get rejectedRequests(): ArtistRequestListItem[] {
    return this.requests.filter((item) => item.status === 'rejected');
  }

  openNewRequest() {
    this.error = '';
    this.successMessage = '';
    this.isEditorOpen = true;
    this.activeTab = 'details';
    this.selectedRequestId = null;
    this.request = this.blankRequest();
    this.commentDraft = '';
    this.inviteArtist = { email: '', fullName: '' };
  }

  async openExistingRequest(requestId: string) {
    this.error = '';
    this.successMessage = '';
    this.isEditorOpen = true;
    this.activeTab = 'details';
    this.selectedRequestId = requestId;
    this.commentDraft = '';
    this.inviteArtist = { email: '', fullName: '' };

    const detail = await this.supabase.getArtistWorkspaceRequestDetail(requestId);
    if (!detail) {
      this.error = 'Request details could not be loaded.';
      return;
    }

    this.request = detail;
  }

  closeEditor() {
    this.isEditorOpen = false;
    this.selectedRequestId = null;
    this.request = this.blankRequest();
  }

  addMedia(mediaType: 'CD' | 'Video') {
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
    this.request.media = this.request.media.filter((_, itemIndex) => itemIndex !== index);
  }

  addArtistSelection() {
    this.request.artists = [
      ...this.request.artists,
      {
        artist_id: null,
        invited_artist_id: null,
        invited_email: '',
        display_name: '',
      },
    ];
  }

  removeArtistSelection(index: number) {
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
    };
  }

  async onRequestImageSelected(event: Event) {
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

  async saveRequest() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Request could not be saved.';
      return;
    }

    this.error = '';
    this.successMessage = '';

    if (!this.request.event_title.trim()) {
      this.error = 'Event title is required.';
      this.activeTab = 'details';
      return;
    }

    if (!this.request.start_date) {
      this.error = 'Start date is required.';
      this.activeTab = 'dates';
      return;
    }

    if (this.request.request_type === 'period' && !this.request.end_date) {
      this.error = 'End date is required for a period request.';
      this.activeTab = 'dates';
      return;
    }

    this.isSaving = true;
    const result = await this.supabase.saveArtistWorkspaceRequest(profileId, this.request);
    if (result.error || !result.requestId) {
      this.error = result.error ?? 'Request could not be saved.';
      this.isSaving = false;
      return;
    }

    this.request.id = result.requestId;
    this.selectedRequestId = result.requestId;
    this.successMessage = 'Request saved successfully.';
    this.isSaving = false;
    await this.loadRequests(profileId);
  }

  async addComment() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request.id) {
      this.error = 'Save the request before adding comments.';
      return;
    }

    if (!this.commentDraft.trim()) {
      this.error = 'Comment is required.';
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
    const profileId = this.authService.currentUser?.id;
    if (!profileId || !this.request.id) {
      this.error = 'Save the request before inviting an artist.';
      return;
    }

    if (!this.inviteArtist.email.trim() || !this.inviteArtist.fullName.trim()) {
      this.error = 'Invite artist email and full name are required.';
      return;
    }

    const result = await this.supabase.inviteArtistForRequest(
      profileId,
      this.request.id,
      this.inviteArtist.email,
      this.inviteArtist.fullName
    );

    if (result.error) {
      this.error = result.error;
      return;
    }

    const refreshed = await this.supabase.getArtistWorkspaceRequestDetail(this.request.id);
    if (refreshed) {
      this.request = refreshed;
    }
    this.inviteArtist = { email: '', fullName: '' };
    this.successMessage = 'Artist invited successfully.';
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

  private blankRequest(): ArtistRequestDetail {
    return {
      event_domain_id: null,
      event_title: '',
      teaser: '',
      long_teaser: '',
      description: '',
      request_type: 'day_show',
      start_date: '',
      end_date: '',
      event_time: '',
      image_url: null,
      status: 'pending',
      media: [],
      artists: [],
      comments: [],
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
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist requests could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadRequests(profileId: string) {
    this.requests = await this.supabase.getArtistWorkspaceRequests(profileId);
  }
}
