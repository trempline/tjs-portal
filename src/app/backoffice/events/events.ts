import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AdminEventOverviewItem, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './events.html',
})
export class Events implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  activeTab: 'upcoming' | 'past' = 'upcoming';
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
      this.items = overview.filter((item) => item.event_type === 'EVENT_INSTANCE');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load events.';
    } finally {
      this.isLoading = false;
    }
  }

  setTab(tab: 'upcoming' | 'past') {
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
      ? 'Your membership expired. An admin must record your renewal payment before you can browse or manage events.'
      : 'Your membership has not been activated yet. An admin must record your payment before you can browse or manage events.';
  }

  get isCommitteeMember(): boolean {
    return this.authService.isCommitteeMember;
  }

  get supportsOverview(): boolean {
    return this.authService.isAdmin || this.isCommitteeMember;
  }

  get scopeLabel(): string {
    if (!this.isCommitteeMember) {
      return 'All platform events';
    }

    return this.showAllPlatform ? 'All platform events' : 'My artists only';
  }

  get filteredEvents() {
    const query = this.searchQuery.trim().toLowerCase();

    return this.items.filter((item) => {
      const matchesScope =
        !this.isCommitteeMember ||
        this.showAllPlatform ||
        item.artist_ids.some((artistId) => this.myArtistIds.has(artistId));

      if (!matchesScope) {
        return false;
      }

      const isPast = ['COMPLETED', 'CANCELLED'].includes(item.status);
      if (this.activeTab === 'upcoming' && isPast) {
        return false;
      }

      if (this.activeTab === 'past' && !isPast) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystacks = [
        item.title,
        item.description ?? '',
        item.artist_names.join(' '),
        item.host_names.join(' '),
        item.city ?? '',
        this.displayStatus(item),
        this.displayHostStatuses(item).join(' '),
      ];

      return haystacks.some((value) => value.toLowerCase().includes(query));
    });
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'APPROVED':
      case 'SELECTED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  displayStatus(item: AdminEventOverviewItem): string {
    switch (item.status) {
      case 'APPROVED':
        return 'Upcoming';
      case 'SELECTED':
        return 'Pending';
      case 'COMPLETED':
        return 'Completed';
      default:
        return item.status;
    }
  }

  displayHostStatuses(item: AdminEventOverviewItem): string[] {
    return item.host_statuses.map((status) => {
      switch (status) {
        case 'CONFIRMED':
          return 'Published';
        case 'PENDING':
          return 'Draft';
        default:
          return status;
      }
    });
  }

  primaryDate(item: AdminEventOverviewItem): string | null {
    return item.selected_dates[0] ?? null;
  }

  primaryArtist(item: AdminEventOverviewItem): string {
    return item.artist_names[0] ?? 'Unassigned';
  }
}
