import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminEventOverviewItem, SupabaseService, TjsUserWithRoles } from '../../services/supabase.service';

type OverviewTab = 'all' | 'requests' | 'events';
type RequestStatusKey = 'PENDING' | 'APPROVED' | 'AVAILABLE';
type RequestStatusFilter = 'ALL' | RequestStatusKey;

interface RequestStatusMetric {
  status: RequestStatusKey;
  label: string;
  description: string;
  count: number;
  share: number;
  barWidth: number;
  dotClass: string;
  barClass: string;
}

interface UpcomingEventInsight {
  item: AdminEventOverviewItem;
  date: string;
  hostName: string | null;
  primaryArtist: string | null;
  artistCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  isLoading = true;
  error = '';
  activeTab: OverviewTab = 'all';
  selectedRequestStatus: RequestStatusFilter = 'ALL';
  searchQuery = '';
  items: AdminEventOverviewItem[] = [];
  membershipUsers: TjsUserWithRoles[] = [];
  private readonly trackedRequestStatuses: RequestStatusKey[] = ['PENDING', 'APPROVED', 'AVAILABLE'];
  private readonly monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
  readonly dummyItems: AdminEventOverviewItem[] = [
    {
      id: 'demo-request-1',
      title: 'Salon recital for spring donors',
      description: 'Private donor evening in central Paris.',
      teaser: 'Private donor evening in central Paris.',
      event_domain_name: 'Private Salon',
      event_type: 'REQUEST',
      status: 'PENDING',
      origin_website: 'TJS',
      visibility_scope: ['TJS'],
      parent_event_id: null,
      created_by: null,
      created_at: '2026-03-10T09:00:00Z',
      updated_at: '2026-03-10T09:00:00Z',
      proposed_dates: ['2026-04-14', '2026-04-16'],
      department: '75',
      city: 'Paris',
      creator_name: 'Claire Martin',
      creator_email: 'claire.martin@example.com',
      accepted_host_profile_ids: [],
      host_ids: [],
      host_names: [],
      host_statuses: [],
      selected_dates: [],
      artist_ids: ['demo-artist-1'],
      artist_names: ['Lea Moreau'],
      artist_roles: ['PRIMARY'],
    },
    {
      id: 'demo-request-2',
      title: 'Family chamber concert request',
      description: 'Small-format performance request for a private home.',
      teaser: 'Small-format performance request for a private home.',
      event_domain_name: 'Chamber Music',
      event_type: 'REQUEST',
      status: 'AVAILABLE',
      origin_website: 'TJS',
      visibility_scope: ['TJS'],
      parent_event_id: null,
      created_by: null,
      created_at: '2026-03-05T15:30:00Z',
      updated_at: '2026-03-06T12:00:00Z',
      proposed_dates: ['2026-05-03'],
      department: '69',
      city: 'Lyon',
      creator_name: 'Marc Dubois',
      creator_email: 'marc.dubois@example.com',
      accepted_host_profile_ids: [],
      host_ids: [],
      host_names: [],
      host_statuses: [],
      selected_dates: [],
      artist_ids: ['demo-artist-2'],
      artist_names: ['Thomas Garnier'],
      artist_roles: ['PRIMARY'],
    },
    {
      id: 'demo-request-3',
      title: 'Summer terrace showcase',
      description: 'Open-air request awaiting committee validation.',
      teaser: 'Open-air request awaiting committee validation.',
      event_domain_name: 'Outdoor Showcase',
      event_type: 'REQUEST',
      status: 'APPROVED',
      origin_website: 'TJS',
      visibility_scope: ['TJS'],
      parent_event_id: null,
      created_by: null,
      created_at: '2026-02-27T11:00:00Z',
      updated_at: '2026-03-01T10:15:00Z',
      proposed_dates: ['2026-06-21'],
      department: '13',
      city: 'Marseille',
      creator_name: 'Sophie Laurent',
      creator_email: 'sophie.laurent@example.com',
      accepted_host_profile_ids: [],
      host_ids: [301],
      host_names: ['Maison du Port'],
      host_statuses: ['CONFIRMED'],
      selected_dates: ['2026-06-21'],
      artist_ids: ['demo-artist-3'],
      artist_names: ['Sophie Laurent Quartet'],
      artist_roles: ['PRIMARY'],
    },
    {
      id: 'demo-event-1',
      title: 'Beethoven Evening at Villa TJS',
      description: 'Confirmed concert instance created from an approved request.',
      teaser: null,
      event_domain_name: null,
      event_type: 'EVENT_INSTANCE',
      status: 'APPROVED',
      origin_website: 'TJS',
      visibility_scope: ['TJS'],
      parent_event_id: 'demo-request-3',
      created_by: null,
      created_at: '2026-03-02T09:45:00Z',
      updated_at: '2026-03-08T18:00:00Z',
      proposed_dates: null,
      department: null,
      city: 'Marseille',
      creator_name: 'Admin TJS',
      creator_email: 'admin@tjs.example.com',
      accepted_host_profile_ids: [],
      host_ids: [301],
      host_names: ['Maison du Port'],
      host_statuses: ['CONFIRMED'],
      selected_dates: ['2026-06-21'],
      artist_ids: ['demo-artist-3', 'demo-artist-4'],
      artist_names: ['Sophie Laurent Quartet', 'Emilie Bernard'],
      artist_roles: ['PRIMARY', 'ACCOMPANIST'],
    },
    {
      id: 'demo-event-2',
      title: 'Young Artists Showcase',
      description: 'Host selected event instance still in progress.',
      teaser: null,
      event_domain_name: null,
      event_type: 'EVENT_INSTANCE',
      status: 'SELECTED',
      origin_website: 'TJS',
      visibility_scope: ['TJS'],
      parent_event_id: 'demo-request-2',
      created_by: null,
      created_at: '2026-03-12T10:00:00Z',
      updated_at: '2026-03-14T09:15:00Z',
      proposed_dates: null,
      department: null,
      city: 'Lyon',
      creator_name: 'Admin TJS',
      creator_email: 'admin@tjs.example.com',
      accepted_host_profile_ids: [],
      host_ids: [302],
      host_names: ['Hotel des Artistes'],
      host_statuses: ['PENDING'],
      selected_dates: ['2026-05-03'],
      artist_ids: ['demo-artist-5'],
      artist_names: ['Nathan Roche'],
      artist_roles: ['PRIMARY'],
    },
    {
      id: 'demo-event-3',
      title: 'Winter Benefit Recital',
      description: 'Completed event retained for full admin visibility.',
      teaser: null,
      event_domain_name: null,
      event_type: 'EVENT_INSTANCE',
      status: 'COMPLETED',
      origin_website: 'TJS',
      visibility_scope: ['TJS'],
      parent_event_id: null,
      created_by: null,
      created_at: '2026-01-15T08:00:00Z',
      updated_at: '2026-02-01T23:00:00Z',
      proposed_dates: null,
      department: null,
      city: 'Bordeaux',
      creator_name: 'Admin TJS',
      creator_email: 'admin@tjs.example.com',
      accepted_host_profile_ids: [],
      host_ids: [303],
      host_names: ['Chateau Rive Gauche'],
      host_statuses: ['CONFIRMED'],
      selected_dates: ['2026-01-30'],
      artist_ids: ['demo-artist-6'],
      artist_names: ['Camille Petit'],
      artist_roles: ['PRIMARY'],
    },
  ];

  async ngOnInit() {
    await this.loadOverview();
  }

  async loadOverview() {
    this.isLoading = true;
    this.error = '';
    const currentUserId = this.authService.currentUser?.id ?? '';
    if (currentUserId) {
      const syncResult = await this.supabase.syncExpiredMemberships(currentUserId);
      if (syncResult.error) {
        this.error = syncResult.error;
      }
    }

    const [liveItems, membershipUsers] = await Promise.all([
      this.supabase.getAdminEventOverview(),
      this.supabase.listAllUsersWithRoles(),
    ]);
    this.items = liveItems.length > 0 ? liveItems : this.dummyItems;
    this.membershipUsers = membershipUsers;
    this.isLoading = false;
  }

  setTab(tab: OverviewTab) {
    this.activeTab = tab;
  }

  setRequestStatusFilter(status: RequestStatusFilter) {
    if (status === 'ALL') {
      this.selectedRequestStatus = 'ALL';
      return;
    }

    this.selectedRequestStatus = this.selectedRequestStatus === status ? 'ALL' : status;
    this.activeTab = 'requests';
  }

  focusUpcomingEvents() {
    this.selectedRequestStatus = 'ALL';
    this.activeTab = 'events';
  }

  get stats() {
    const requests = this.items.filter((item) => item.event_type === 'REQUEST');
    const events = this.items.filter((item) => item.event_type === 'EVENT_INSTANCE');

    return [
      {
        label: 'Toutes les demandes',
        value: requests.length,
        color: 'bg-amber-500',
        icon: 'request',
      },
      {
        label: 'Toutes les instances',
        value: events.length,
        color: 'bg-red-600',
        icon: 'events',
      },
      {
        label: 'Demandes ouvertes',
        value: requests.filter((item) => ['IN_EDITION', 'AVAILABLE', 'PENDING'].includes(item.status)).length,
        color: 'bg-blue-600',
        icon: 'open',
      },
      {
        label: 'Evenements actifs',
        value: events.filter((item) => !['CANCELLED', 'COMPLETED'].includes(item.status)).length,
        color: 'bg-emerald-600',
        icon: 'active',
      },
    ];
  }

  get membershipSummary() {
    const active = this.membershipUsers.filter((user) => this.membershipStatus(user) === 'active').length;
    const expired = this.membershipUsers.filter((user) => this.membershipStatus(user) === 'expired').length;
    const nonMember = this.membershipUsers.filter((user) => this.membershipStatus(user) === 'non-member').length;
    const blocked = this.membershipUsers.filter((user) => this.isMembershipBlocked(user)).length;

    return { active, expired, nonMember, blocked };
  }

  get membershipAttentionUsers() {
    return this.membershipUsers
      .filter((user) => this.isMembershipBlocked(user))
      .sort((a, b) => a.email.localeCompare(b.email))
      .slice(0, 5);
  }

  get requestItems() {
    return this.items.filter((item) => item.event_type === 'REQUEST');
  }

  get requestStatusMetrics(): RequestStatusMetric[] {
    const counts = this.trackedRequestStatuses.map((status) => ({
      status,
      count: this.requestItems.filter((item) => item.status === status).length,
    }));
    const trackedTotal = counts.reduce((sum, entry) => sum + entry.count, 0);
    const maxCount = Math.max(...counts.map((entry) => entry.count), 1);

    return counts.map(({ status, count }) => ({
      status,
      count,
      label: this.requestStatusLabel(status),
      description: this.requestStatusDescription(status),
      share: trackedTotal === 0 ? 0 : Math.round((count / trackedTotal) * 100),
      barWidth: count === 0 ? 0 : (count / maxCount) * 100,
      dotClass: this.requestStatusDotClass(status),
      barClass: this.requestStatusBarClass(status),
    }));
  }

  get trackedRequestCount() {
    return this.requestStatusMetrics.reduce((sum, entry) => sum + entry.count, 0);
  }

  get currentMonthLabel() {
    return this.monthFormatter.format(new Date());
  }

  get nextUpcomingEvent(): UpcomingEventInsight | null {
    return this.upcomingEventInsights[0] ?? null;
  }

  get upcomingEventsThisMonthCount() {
    const now = new Date();

    return this.upcomingEventInsights.filter((entry) => {
      const date = this.parseDateOnly(entry.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }

  get filteredItems() {
    const q = this.searchQuery.trim().toLowerCase();

    return this.items.filter((item) => {
      const matchesTab =
        this.activeTab === 'all' ||
        (this.activeTab === 'requests' && item.event_type === 'REQUEST') ||
        (this.activeTab === 'events' && item.event_type === 'EVENT_INSTANCE');

      if (!matchesTab) {
        return false;
      }

      if (this.selectedRequestStatus !== 'ALL' && (item.event_type !== 'REQUEST' || item.status !== this.selectedRequestStatus)) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystacks = [
        item.title,
        item.status,
        this.displayStatus(item),
        item.origin_website,
        item.creator_name,
        item.creator_email,
        item.city ?? '',
        item.department ?? '',
        item.host_names.join(' '),
        this.displayHostStatuses(item).join(' '),
        item.artist_names.join(' '),
      ];

      return haystacks.some((value) => value.toLowerCase().includes(q));
    });
  }

  get tabCounts() {
    return {
      all: this.items.length,
      requests: this.items.filter((item) => item.event_type === 'REQUEST').length,
      events: this.items.filter((item) => item.event_type === 'EVENT_INSTANCE').length,
    };
  }

  get usingDummyData(): boolean {
    return this.items === this.dummyItems;
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'AVAILABLE':
      case 'IN_EDITION':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
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
    if (item.event_type !== 'EVENT_INSTANCE') {
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
    if (item.event_type !== 'EVENT_INSTANCE') {
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

  typeLabel(item: AdminEventOverviewItem): string {
    return item.event_type === 'REQUEST' ? 'Request' : 'Event';
  }

  membershipStatus(user: TjsUserWithRoles): 'active' | 'expired' | 'non-member' {
    if (!user.is_member) {
      return 'non-member';
    }

    if (!user.member_until) {
      return 'active';
    }

    return this.parseDateOnly(user.member_until).getTime() >= this.parseDateOnly(this.todayDateString()).getTime()
      ? 'active'
      : 'expired';
  }

  membershipStatusLabel(user: TjsUserWithRoles): string {
    switch (this.membershipStatus(user)) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      default:
        return 'Non-Member';
    }
  }

  membershipStatusClass(user: TjsUserWithRoles): string {
    switch (this.membershipStatus(user)) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'expired':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  isMembershipBlocked(user: TjsUserWithRoles): boolean {
    const workspaceRoles = ['Artist', 'Host', 'Host+', 'Host Manager'];
    const privilegedRoles = ['Admin', 'Committee Member'];

    return user.roles.some((role) => workspaceRoles.includes(role.name)) &&
      !user.roles.some((role) => privilegedRoles.includes(role.name)) &&
      this.membershipStatus(user) !== 'active';
  }

  requestStatusLabel(status: RequestStatusFilter): string {
    if (status === 'ALL') {
      return 'All';
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

  requestStatusDescription(status: RequestStatusKey): string {
    switch (status) {
      case 'PENDING':
        return 'Needs committee review before it can move forward.';
      case 'APPROVED':
        return 'Validated and ready for host coordination.';
      case 'AVAILABLE':
        return 'Open for hosts to pick up and schedule.';
      default:
        return status;
    }
  }

  requestStatusDotClass(status: RequestStatusKey): string {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500';
      case 'APPROVED':
        return 'bg-blue-600';
      case 'AVAILABLE':
        return 'bg-emerald-500';
      default:
        return 'bg-zinc-400';
    }
  }

  requestStatusBarClass(status: RequestStatusKey): string {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500';
      case 'APPROVED':
        return 'bg-blue-600';
      case 'AVAILABLE':
        return 'bg-emerald-500';
      default:
        return 'bg-zinc-400';
    }
  }

  primaryArtistName(item: AdminEventOverviewItem): string | null {
    const primaryIndex = item.artist_roles.findIndex((role) => role === 'PRIMARY');
    if (primaryIndex >= 0 && item.artist_names[primaryIndex]) {
      return item.artist_names[primaryIndex];
    }

    return item.artist_names[0] ?? null;
  }

  preferredHostName(item: AdminEventOverviewItem): string | null {
    const confirmedIndex = item.host_statuses.findIndex((status) => status === 'CONFIRMED');
    if (confirmedIndex >= 0 && item.host_names[confirmedIndex]) {
      return item.host_names[confirmedIndex];
    }

    return item.host_names[0] ?? null;
  }

  primaryDate(item: AdminEventOverviewItem): string | null {
    if (item.event_type === 'REQUEST') {
      return item.proposed_dates?.[0] ?? null;
    }

    return item.selected_dates[0] ?? null;
  }

  private get upcomingEventInsights(): UpcomingEventInsight[] {
    return this.items
      .filter((item) => item.event_type === 'EVENT_INSTANCE' && !['CANCELLED', 'COMPLETED'].includes(item.status))
      .map((item) => {
        const date = this.nextUpcomingSelectedDate(item);
        if (!date) {
          return null;
        }

        return {
          item,
          date,
          hostName: this.preferredHostName(item),
          primaryArtist: this.primaryArtistName(item),
          artistCount: item.artist_names.length,
        };
      })
      .filter((entry): entry is UpcomingEventInsight => entry !== null)
      .sort((a, b) => this.parseDateOnly(a.date).getTime() - this.parseDateOnly(b.date).getTime());
  }

  private nextUpcomingSelectedDate(item: AdminEventOverviewItem): string | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...item.selected_dates]
      .sort((a, b) => this.parseDateOnly(a).getTime() - this.parseDateOnly(b).getTime())
      .find((date) => this.parseDateOnly(date).getTime() >= today.getTime()) ?? null;
  }

  private parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }

  private todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
