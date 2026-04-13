import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminEventOverviewItem, SupabaseService, TjsHost } from '../../services/supabase.service';

@Component({
  selector: 'app-event-requests',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './event-requests.html',
})
export class EventRequests implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  activeTab: 'PENDING' | 'APPROVED' | 'AVAILABLE' | 'SELECTED' = 'PENDING';
  isLoading = true;
  error = '';
  searchQuery = '';
  showAllPlatform = false;

  items: AdminEventOverviewItem[] = [];
  myArtistIds = new Set<string>();
  hostOptions: TjsHost[] = [];

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

      const [artists, overview, hostOptions] = await Promise.all([
        artistScope ? this.supabase.getArtists(artistScope) : Promise.resolve([]),
        this.supabase.getAdminEventOverview(),
        this.isHostWorkspace && currentUserId ? this.supabase.getMyHosts(currentUserId) : Promise.resolve([]),
      ]);

      this.myArtistIds = new Set(artists.map((artist) => artist.id));
      this.items = overview.filter((item) => item.event_type === 'REQUEST');
      this.hostOptions = hostOptions;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load event requests.';
    } finally {
      this.isLoading = false;
    }
  }

  setTab(tab: 'PENDING' | 'APPROVED' | 'AVAILABLE' | 'SELECTED') {
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

  get isHostWorkspace(): boolean {
    return this.authService.hasAnyRole(['Host', 'Host+']) && !this.authService.isHostManager;
  }

  get supportsOverview(): boolean {
    return this.authService.isAdmin || this.isCommitteeMember || this.isHostWorkspace;
  }

  get scopeLabel(): string {
    if (this.isHostWorkspace) {
      return 'All artist requests';
    }

    if (!this.isCommitteeMember) {
      return 'All platform requests';
    }

    return this.showAllPlatform ? 'All platform requests' : 'My artists only';
  }

  get filteredRequests() {
    const query = this.searchQuery.trim().toLowerCase();
    const hostIds = new Set(this.hostOptions.map((host) => host.id));

    return this.items.filter((item) => {
      if (this.isHostWorkspace && !['PENDING', 'SELECTED', 'APPROVED'].includes(item.status)) {
        return false;
      }

      const isAssignedToHost = item.host_ids.some((hostId) => hostIds.has(hostId));
      const matchesHostWorkflow = !this.isHostWorkspace
        || item.status === 'PENDING'
        || ((item.status === 'SELECTED' || item.status === 'APPROVED') && isAssignedToHost);

      const matchesScope =
        !this.isCommitteeMember ||
        this.showAllPlatform ||
        item.artist_ids.some((artistId) => this.myArtistIds.has(artistId));

      if (!matchesHostWorkflow || !matchesScope || item.status !== this.activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystacks = [
        item.title,
        item.teaser ?? '',
        item.event_domain_name ?? '',
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
      case 'SELECTED':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  requestStatusLabel(status: string): string {
    if (this.isHostWorkspace) {
      switch (status) {
        case 'PENDING':
          return 'Pending';
        case 'SELECTED':
          return 'Accepted';
        case 'APPROVED':
          return 'Approved';
        default:
          return status;
      }
    }

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

  requestDates(item: AdminEventOverviewItem): string[] {
    return item.proposed_dates ?? [];
  }

  teaserText(item: AdminEventOverviewItem): string {
    return item.teaser || item.description || 'No teaser';
  }

  async openRequest(item: AdminEventOverviewItem) {
    if (!this.isHostWorkspace) {
      return;
    }

    await this.router.navigate(['/backoffice/host/requests', item.id]);
  }
}
