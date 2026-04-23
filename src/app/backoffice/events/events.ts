import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminEventOverviewItem, EventLocationSummary, SupabaseService, TjsArtist, TjsHost } from '../../services/supabase.service';
import { HostManagerService } from '../../services/host-manager.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './events.html',
})
export class Events implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private hostManagerService = inject(HostManagerService);
  private router = inject(Router);

  activeTab: 'upcoming' | 'past' = 'upcoming';
  isLoading = true;
  error = '';
  searchQuery = '';
  showAllPlatform = true;

  items: AdminEventOverviewItem[] = [];
  myArtistIds = new Set<string>();
  managedHostIds = new Set<number>();
  eventLocationSummaries = new Map<string, EventLocationSummary>();

  async ngOnInit() {
    await this.authService.waitForAuthReady();

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
      const currentUserId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
      const artistScope = this.isCommitteeMember && currentUserId
        ? { committeeMemberId: currentUserId, createdById: currentUserId }
        : undefined;

      const [artists, overview, managedHosts] = await Promise.all([
        artistScope ? this.supabase.getArtists(artistScope) : Promise.resolve([]),
        this.supabase.getAdminEventOverview(),
        this.isHostManager && currentUserId
          ? lastValueFrom(this.hostManagerService.getAssignedHosts(currentUserId))
          : Promise.resolve([]),
      ]);

      this.myArtistIds = new Set((artists as TjsArtist[]).map((artist: TjsArtist) => artist.id));
      this.managedHostIds = new Set((managedHosts as TjsHost[]).map((host: TjsHost) => host.id));
      this.items = overview.filter((item: AdminEventOverviewItem) => {
        if (item.event_type !== 'EVENT_INSTANCE') {
          return false;
        }

        if (this.isHostManager) {
          return item.host_ids.some((hostId: number) => this.managedHostIds.has(hostId));
        }

        return true;
      });

      this.eventLocationSummaries = (this.isHostManager || this.isCommitteeMember)
        ? await this.supabase.getEventLocationSummaries(
            this.items.map((item) => item.id),
            this.isHostManager ? Array.from(this.managedHostIds) : undefined,
          )
        : new Map<string, EventLocationSummary>();
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
    return this.authService.isAdmin || this.isCommitteeMember || this.isHostManager;
  }

  get isHostManager(): boolean {
    return this.authService.isHostManager;
  }

  get canCreateEvents(): boolean {
    return this.isHostManager;
  }

  get scopeLabel(): string {
    if (this.isHostManager) {
      return 'My host events';
    }

    if (!this.isCommitteeMember) {
      return 'All platform events';
    }

    return this.showAllPlatform ? 'All platform events' : 'My artists only';
  }

  get committeeFilterButtonLabel(): string {
    return this.showAllPlatform ? 'Filter: My artists only' : 'Filter: All platform events';
  }

  get filteredEvents() {
    const query = this.searchQuery.trim().toLowerCase();

    return this.items.filter((item) => {
      const matchesScope =
        (this.isHostManager && item.host_ids.some((hostId) => this.managedHostIds.has(hostId))) ||
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
        item.is_member_only ? 'member only yes true' : 'member only no false',
        this.locationSummary(item),
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
    if (this.isHostManager) {
      return item.status;
    }

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
    if (this.isHostManager) {
      return item.host_statuses;
    }

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

  artistsSummary(item: AdminEventOverviewItem): string {
    return this.compactSummary(item.artist_names, 'Unassigned');
  }

  hostsSummary(item: AdminEventOverviewItem): string {
    return this.compactSummary(item.host_names, 'Unassigned');
  }

  locationSummary(item: AdminEventOverviewItem): string {
    if (this.eventLocationSummaries.has(item.id)) {
      return this.eventLocationSummaries.get(item.id)?.display_label ?? 'Unknown';
    }

    const fallbacks = [item.city, item.department].filter((value): value is string => !!value);
    return this.compactSummary(fallbacks, 'Unknown');
  }

  startDateSummary(item: AdminEventOverviewItem): string {
    const dates = [...item.selected_dates].sort((left, right) => left.localeCompare(right));
    if (dates.length === 0) {
      return 'Not scheduled';
    }

    const firstDate = dates[0];
    return dates.length > 1 ? `${firstDate} +${dates.length - 1}` : firstDate;
  }

  editionLabel(item: AdminEventOverviewItem): string {
    return (item as AdminEventOverviewItem & { edition?: string | null }).edition || '-';
  }

  eventTypeNameLabel(item: AdminEventOverviewItem): string {
    const explicitName = (item as AdminEventOverviewItem & { event_type_name?: string | null }).event_type_name;
    if (explicitName) {
      return explicitName;
    }

    if (item.event_type === 'EVENT_INSTANCE') {
      return 'Event';
    }

    if (item.event_type === 'REQUEST') {
      return 'Request';
    }

    return item.event_type || '-';
  }

  locationLabel(item: AdminEventOverviewItem): string {
    if (this.isHostManager) {
      return this.eventLocationSummaries.get(item.id)?.display_label ?? 'Unknown';
    }

    return item.city || item.department || 'Unknown';
  }

  async openEvent(item: AdminEventOverviewItem) {
    if (!this.isHostManager && !this.isCommitteeMember && !this.authService.isAdmin) {
      return;
    }

    await this.router.navigate([
      this.isHostManager ? '/backoffice/host-manager/events' : '/backoffice/events',
      item.id,
    ]);
  }

  async goToCreateEvent() {
    if (!this.canCreateEvents) {
      return;
    }

    await this.router.navigate([
      this.isHostManager ? '/backoffice/host-manager/events/new' : '/backoffice/host/events/new',
    ]);
  }

  private compactSummary(values: string[], fallback: string): string {
    const normalized = values.filter((value) => !!value);
    if (normalized.length === 0) {
      return fallback;
    }

    return normalized.length > 1 ? `${normalized[0]} +${normalized.length - 1}` : normalized[0];
  }
}
