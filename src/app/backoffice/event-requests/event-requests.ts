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

  activeTab: 'PENDING' | 'APPROVED' | 'AVAILABLE' | 'SELECTED' | 'new_request' | 'accepted_by_host' | 'host_proposed' | 'artist_proposed' | 'artist_accepted' | 'published' | 'rejected' = 'new_request';
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

    if (!this.isHostWorkspace) {
      this.activeTab = 'PENDING';
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

  setTab(tab: 'PENDING' | 'APPROVED' | 'AVAILABLE' | 'SELECTED' | 'new_request' | 'accepted_by_host' | 'host_proposed' | 'artist_proposed' | 'artist_accepted' | 'published' | 'rejected') {
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
    if (!this.isCommitteeMember) {
      return 'All platform requests';
    }

    return this.showAllPlatform ? 'All platform requests' : 'My artists only';
  }

  get filteredRequests() {
    const query = this.searchQuery.trim().toLowerCase();
    const hostIds = new Set(this.hostOptions.map((host) => host.id));
    const currentUserId = this.authService.currentUser?.id ?? '';

    return this.items.filter((item) => {
      if (this.isHostWorkspace && !['new_request', 'accepted_by_host', 'host_proposed', 'artist_proposed', 'artist_accepted', 'approved', 'published'].includes(item.status)) {
        return false;
      }

      const isAssignedToHost = item.host_ids.some((hostId) => hostIds.has(hostId));
      const isAcceptedByCurrentHost = item.accepted_host_profile_ids.includes(currentUserId);
      const matchesActiveTab = this.isHostWorkspace
        ? item.status === this.activeTab
        : this.activeTab === 'PENDING'
          ? ['new_request', 'artist_proposed'].includes(item.status)
          : this.activeTab === 'SELECTED'
            ? ['accepted_by_host', 'host_proposed'].includes(item.status)
            : this.activeTab === 'APPROVED'
              ? ['artist_accepted', 'approved', 'published'].includes(item.status)
              : ['accepted_by_host', 'host_proposed'].includes(item.status);
      const matchesHostWorkflow = !this.isHostWorkspace
        || item.status === 'new_request'
        || item.status === 'artist_proposed'
        || (['accepted_by_host', 'host_proposed', 'artist_accepted', 'approved', 'published'].includes(item.status) && (isAssignedToHost || isAcceptedByCurrentHost));

      const matchesScope =
        !this.isCommitteeMember ||
        this.showAllPlatform ||
        item.artist_ids.some((artistId) => this.myArtistIds.has(artistId));

      if (!matchesHostWorkflow || !matchesScope || !matchesActiveTab) {
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
      case 'new_request':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'accepted_by_host':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'host_proposed':
        return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'artist_proposed':
        return 'bg-violet-50 text-violet-700 border border-violet-200';
      case 'artist_accepted':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'approved':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  requestStatusLabel(status: string): string {
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

  primaryRequestDate(item: AdminEventOverviewItem): string | null {
    return this.requestDates(item)[0] ?? null;
  }

  additionalRequestDateCount(item: AdminEventOverviewItem): number {
    return Math.max(0, this.requestDates(item).length - 1);
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
