import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ArtistAvailabilityEntry,
  ArtistInstrumentOption,
  ArtistMediaEntry,
  ArtistRequestArtistEntry,
  ArtistRequestDetail,
  ArtistRequestListItem,
  ArtistWorkspaceProfile,
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
  requestError = '';
  requestSuccessMessage = '';
  isCommentSaving = false;
  requestCommentDraft = '';

  artist: TjsArtist | null = null;
  activeTab: CommitteeArtistDetailTab = 'profile';
  profile: ArtistWorkspaceProfile | null = null;
  pagProfile: PagArtistProfile | null = null;
  instruments: ArtistInstrumentOption[] = [];
  media: ArtistMediaEntry[] = [];
  availability: ArtistAvailabilityEntry[] = [];
  pendingRequests: ArtistRequestListItem[] = [];
  selectedRequest: ArtistRequestDetail | null = null;
  requestLoading = false;

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

      const [profile, instruments, media, availability, requests, pagProfile] = await Promise.all([
        this.supabase.getArtistWorkspaceProfile(artist.profile_id),
        this.supabase.getArtistWorkspaceInstruments(artist.profile_id),
        this.supabase.getArtistWorkspaceMedia(artist.profile_id),
        this.supabase.getArtistWorkspaceAvailability(artist.profile_id),
        this.supabase.getArtistWorkspaceRequests(artist.profile_id),
        artist.pag_artist_id ? this.supabase.getPagArtistProfile(artist.pag_artist_id) : Promise.resolve(null),
      ]);

      this.profile = profile;
      this.pagProfile = pagProfile;
      this.instruments = instruments;
      this.media = media;
      this.availability = availability;
      this.pendingRequests = requests.filter((request) => request.status === 'pending');

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
}
