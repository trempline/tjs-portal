import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminEventOverviewItem, SupabaseService, TjsHost } from '../../services/supabase.service';

type RequestTab = 'PENDING' | 'PUBLISHED' | 'APPROVED' | 'AVAILABLE' | 'SELECTED' | 'new_request' | 'accepted_by_host' | 'host_proposed' | 'artist_proposed' | 'artist_accepted' | 'approved' | 'published' | 'rejected';
type SortOrder = 'latest' | 'oldest';
type EnhancedRequestItem = AdminEventOverviewItem & {
  resolvedEdition: string | null;
  resolvedEventTypeName: string | null;
  resolvedHostNames: string[];
  resolvedCity: string | null;
  resolvedDepartment: string | null;
};

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

  activeTab: RequestTab = 'new_request';
  isLoading = true;
  error = '';
  searchQuery = '';
  selectedEventType = '';
  selectedDomain = '';
  selectedEdition = '';
  selectedStatus = '';
  selectedHost = '';
  selectedLocation = '';
  sortOrder: SortOrder = 'latest';

  items: EnhancedRequestItem[] = [];
  myArtistIds = new Set<string>();
  hostOptions: TjsHost[] = [];

  async ngOnInit() {
    if (!this.supportsOverview) {
      this.isLoading = false;
      return;
    }

    if (!this.isHostRequestWorkspace) {
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
        this.isHostRequestWorkspace && currentUserId ? this.supabase.getAccessibleHosts(currentUserId) : Promise.resolve([]),
      ]);

      this.myArtistIds = new Set(artists.map((artist) => artist.id));
      this.items = this.buildRequestItems(overview);
      this.hostOptions = hostOptions;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load event requests.';
    } finally {
      this.isLoading = false;
    }
  }

  setTab(tab: RequestTab) {
    this.activeTab = tab;
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

  get isHostManagerWorkspace(): boolean {
    return this.authService.isHostManager;
  }

  get isHostRequestWorkspace(): boolean {
    return this.isHostWorkspace || this.isHostManagerWorkspace;
  }

  get supportsOverview(): boolean {
    return this.authService.isAdmin || this.isCommitteeMember || this.isHostRequestWorkspace;
  }

  get scopeLabel(): string {
    if (!this.isCommitteeMember) {
      return '';
    }

    return 'My assigned artists';
  }

  get filteredRequests() {
    const query = this.searchQuery.trim().toLowerCase();
    const hostIds = new Set(this.hostOptions.map((host) => host.id));
    const currentUserId = this.authService.currentUser?.id ?? '';

    return this.items.filter((item) => {
      if (this.isHostRequestWorkspace && !['new_request', 'accepted_by_host', 'host_proposed', 'artist_proposed', 'artist_accepted', 'approved', 'published'].includes(item.status)) {
        return false;
      }

      const isAssignedToHost = item.host_ids.some((hostId) => hostIds.has(hostId));
      const isAcceptedByCurrentHost = item.accepted_host_profile_ids.includes(currentUserId);
      const matchesActiveTab = this.isHostRequestWorkspace
        ? item.status === this.activeTab
        : this.isAdminView
          ? this.activeTab === 'PUBLISHED'
            ? item.status === 'published'
            : item.status !== 'published'
          : this.activeTab === 'PENDING'
            ? ['new_request', 'artist_proposed'].includes(item.status)
          : this.activeTab === 'SELECTED'
            ? ['accepted_by_host', 'host_proposed'].includes(item.status)
            : this.activeTab === 'APPROVED'
              ? ['artist_accepted', 'approved', 'published'].includes(item.status)
              : ['accepted_by_host', 'host_proposed'].includes(item.status);
      const matchesHostWorkflow = !this.isHostRequestWorkspace
        || item.status === 'new_request'
        || item.status === 'artist_proposed'
        || (['accepted_by_host', 'host_proposed', 'artist_accepted', 'approved', 'published'].includes(item.status) && (isAssignedToHost || isAcceptedByCurrentHost));

      const matchesScope =
        !this.isCommitteeMember ||
        item.artist_ids.some((artistId) => this.myArtistIds.has(artistId));

      if (!matchesHostWorkflow || !matchesScope || !matchesActiveTab) {
        return false;
      }

      if (this.selectedEventType && this.eventTypeNameLabel(item) !== this.selectedEventType) {
        return false;
      }

      if (this.selectedDomain && (item.event_domain_name ?? '') !== this.selectedDomain) {
        return false;
      }

      if (this.selectedEdition && this.editionLabel(item) !== this.selectedEdition) {
        return false;
      }

      if (this.selectedStatus && item.status !== this.selectedStatus) {
        return false;
      }

      if (this.selectedHost && !item.resolvedHostNames.includes(this.selectedHost)) {
        return false;
      }

      if (this.selectedLocation && this.locationLabel(item) !== this.selectedLocation) {
        return false;
      }

      return !query || item.title.toLowerCase().includes(query);
    }).sort((left, right) => {
      const leftDate = this.sortTimestamp(left);
      const rightDate = this.sortTimestamp(right);
      return this.sortOrder === 'latest' ? rightDate - leftDate : leftDate - rightDate;
    });
  }

  get isAdminView(): boolean {
    return this.authService.isAdmin && !this.isCommitteeMember && !this.isHostRequestWorkspace;
  }

  get eventTypeOptions(): string[] {
    return this.uniqueValues(this.items.map((item) => this.eventTypeNameLabel(item)));
  }

  get domainOptions(): string[] {
    return this.uniqueValues(this.items.map((item) => item.event_domain_name ?? ''));
  }

  get editionOptions(): string[] {
    return this.uniqueValues(this.items.map((item) => this.editionLabel(item)));
  }

  get statusOptions(): Array<{ value: string; label: string }> {
    return this.uniqueValues(this.items.map((item) => item.status)).map((status) => ({
      value: status,
      label: this.requestStatusLabel(status),
    }));
  }

  get hostFilterOptions(): string[] {
    return this.uniqueValues(this.items.flatMap((item) => item.resolvedHostNames));
  }

  get locationOptions(): string[] {
    return this.uniqueValues(this.items.map((item) => this.locationLabel(item)));
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

  hostsSummary(item: EnhancedRequestItem): string {
    return this.compactSummary(item.resolvedHostNames, 'Unassigned');
  }

  editionLabel(item: EnhancedRequestItem): string {
    return item.resolvedEdition || '-';
  }

  eventTypeNameLabel(item: EnhancedRequestItem): string {
    return item.resolvedEventTypeName || 'Request';
  }

  locationLabel(item: EnhancedRequestItem): string {
    const value = item.resolvedCity || item.resolvedDepartment;
    return value || '-';
  }

  async openRequest(item: AdminEventOverviewItem) {
    if (!this.isHostRequestWorkspace && !this.isCommitteeMember && !this.isAdminView) {
      return;
    }

    await this.router.navigate([
      this.isAdminView || this.isCommitteeMember
        ? '/backoffice/event-requests'
        : this.isHostManagerWorkspace
          ? '/backoffice/host-manager/requests'
          : '/backoffice/host/requests',
      item.id,
    ]);
  }

  private buildRequestItems(overview: AdminEventOverviewItem[]): EnhancedRequestItem[] {
    const eventInstancesByRequestId = new Map<string, AdminEventOverviewItem[]>();

    for (const item of overview) {
      if (item.event_type !== 'EVENT_INSTANCE' || !item.parent_event_id) {
        continue;
      }

      const existing = eventInstancesByRequestId.get(item.parent_event_id) ?? [];
      existing.push(item);
      eventInstancesByRequestId.set(item.parent_event_id, existing);
    }

    return overview
      .filter((item) => item.event_type === 'REQUEST')
      .map((item) => {
        const relatedEvents = eventInstancesByRequestId.get(item.id) ?? [];
        const resolvedEdition = item.edition ?? relatedEvents.find((event) => !!event.edition)?.edition ?? null;
        const resolvedEventTypeName = item.event_type_name ?? relatedEvents.find((event) => !!event.event_type_name)?.event_type_name ?? null;
        const resolvedHostNames = Array.from(new Set([
          ...item.host_names,
          ...relatedEvents.flatMap((event) => event.host_names),
        ]));
        const resolvedCity = item.city ?? relatedEvents.find((event) => !!event.city)?.city ?? null;
        const resolvedDepartment = item.department ?? relatedEvents.find((event) => !!event.department)?.department ?? null;

        return {
          ...item,
          resolvedEdition,
          resolvedEventTypeName,
          resolvedHostNames,
          resolvedCity,
          resolvedDepartment,
        };
      });
  }

  private compactSummary(values: string[], fallback: string): string {
    const normalized = values.filter((value) => !!value);
    if (normalized.length === 0) {
      return fallback;
    }

    return normalized.length > 1 ? `${normalized[0]} +${normalized.length - 1}` : normalized[0];
  }

  private sortTimestamp(item: EnhancedRequestItem): number {
    const primaryDate = this.primaryRequestDate(item) ?? item.created_at;
    const parsed = new Date(primaryDate).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.filter((value) => !!value && value !== '-'))).sort((left, right) => left.localeCompare(right));
  }
}
