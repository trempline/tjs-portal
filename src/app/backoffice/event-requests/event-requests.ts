import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AdminEventOverviewItem, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-event-requests',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './event-requests.html',
})
export class EventRequests implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  activeTab: 'PENDING' | 'APPROVED' | 'AVAILABLE' = 'PENDING';
  isLoading = true;
  error = '';
  searchQuery = '';
  showAllPlatform = false;

  items: AdminEventOverviewItem[] = [];
  myArtistIds = new Set<string>();

  async ngOnInit() {
    if (!this.supportsOverview) {
      this.isLoading = false;
      return;
    }

    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    try {
      const currentUserId = this.authService.currentUser?.id ?? '';
      const artistScope = this.isCommitteeMember && currentUserId
        ? { committeeMemberId: currentUserId, createdById: currentUserId }
        : undefined;

      const [artists, overview] = await Promise.all([
        artistScope ? this.supabase.getArtists(artistScope) : Promise.resolve([]),
        this.supabase.getAdminEventOverview(),
      ]);

      this.myArtistIds = new Set(artists.map((artist) => artist.id));
      this.items = overview.filter((item) => item.event_type === 'REQUEST');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load event requests.';
    } finally {
      this.isLoading = false;
    }
  }

  setTab(tab: 'PENDING' | 'APPROVED' | 'AVAILABLE') {
    this.activeTab = tab;
  }

  togglePlatformScope() {
    this.showAllPlatform = !this.showAllPlatform;
  }

  get isMembershipGated(): boolean {
    return this.authService.isMembershipGated;
  }

  get membershipGateMessage(): string {
    return this.authService.membershipStatus === 'expired'
      ? 'Your membership expired. An admin must record your renewal payment before you can publish or manage requests.'
      : 'Your membership has not been activated yet. An admin must record your payment before you can publish or manage requests.';
  }

  get isCommitteeMember(): boolean {
    return this.authService.isCommitteeMember;
  }

  get supportsOverview(): boolean {
    return this.authService.isAdmin || this.isCommitteeMember;
  }

  get scopeLabel(): string {
    if (!this.isCommitteeMember) {
      return 'All platform requests';
    }

    return this.showAllPlatform ? 'All platform requests' : 'My artists only';
  }

  get filteredRequests() {
    const query = this.searchQuery.trim().toLowerCase();

    return this.items.filter((item) => {
      const matchesScope =
        !this.isCommitteeMember ||
        this.showAllPlatform ||
        item.artist_ids.some((artistId) => this.myArtistIds.has(artistId));

      if (!matchesScope || item.status !== this.activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystacks = [
        item.title,
        item.description ?? '',
        item.artist_names.join(' '),
        item.creator_name,
        item.creator_email,
        item.city ?? '',
        item.department ?? '',
        this.requestStatusLabel(item.status),
      ];

      return haystacks.some((value) => value.toLowerCase().includes(query));
    });
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  requestStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Approved';
      case 'AVAILABLE':
        return 'Available';
      default:
        return status;
    }
  }

  primaryDate(item: AdminEventOverviewItem): string | null {
    return item.proposed_dates?.[0] ?? null;
  }

  primaryArtist(item: AdminEventOverviewItem): string {
    return item.artist_names[0] ?? 'Unassigned';
  }
}
