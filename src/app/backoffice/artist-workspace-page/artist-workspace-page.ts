import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf, SlicePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  AdminEventOverviewItem,
  ArtistAvailabilityEntry,
  ArtistConversationSummary,
  ArtistNotificationItem,
  ArtistRequestListItem,
  HostWorkspaceEventItem,
  SupabaseService,
  TjsLocation,
} from '../../services/supabase.service';

interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
}

@Component({
  selector: 'app-artist-workspace-page',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, SlicePipe, RouterLink],
  templateUrl: './artist-workspace-page.html',
})
export class ArtistWorkspacePage implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = false;
  error = '';

  upcomingEvents: AdminEventOverviewItem[] = [];
  conversations: ArtistConversationSummary[] = [];
  notifications: ArtistNotificationItem[] = [];
  requests: ArtistRequestListItem[] = [];
  availabilityEntries: ArtistAvailabilityEntry[] = [];
  hostEvents: HostWorkspaceEventItem[] = [];
  hostRequests: AdminEventOverviewItem[] = [];
  privateLocations: TjsLocation[] = [];
  calendarCursor = this.startOfMonth(new Date());

  async ngOnInit() {
    if (!this.isArtistDashboard && !this.isHostDashboard) {
      return;
    }

    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist dashboard could not be loaded.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      if (this.isArtistDashboard) {
        const [events, conversations, notifications, requests, availability] = await Promise.all([
          this.supabase.getArtistWorkspaceUpcomingEvents(profileId),
          this.supabase.getArtistConversations(profileId),
          this.supabase.getArtistWorkspaceNotifications(profileId, this.authService.currentRoles.map((role) => role.id)),
          this.supabase.getArtistWorkspaceRequests(profileId),
          this.supabase.getArtistWorkspaceAvailability(profileId),
        ]);

        this.upcomingEvents = events;
        this.conversations = conversations.filter((conversation) => conversation.unread_count > 0);
        this.notifications = notifications.filter((notification) => !notification.is_read && !this.isNotificationExpired(notification));
        this.requests = requests.filter((request) => request.status !== 'published');
        this.availabilityEntries = availability;
      }

      if (this.isHostDashboard) {
        const [events, overview, hosts, locations] = await Promise.all([
          this.supabase.getHostWorkspaceEvents(profileId),
          this.supabase.getAdminEventOverview(),
          this.supabase.getMyHosts(profileId),
          this.supabase.getPrivateLocations(profileId),
        ]);

        const hostIds = new Set(hosts.map((host) => host.id));
        const currentUserId = this.authService.currentUser?.id ?? '';

        this.hostEvents = events
          .filter((event) => !!event.primary_upcoming_date && event.primary_upcoming_date >= this.todayDateKey())
          .sort((a, b) => (a.primary_upcoming_date ?? '9999-12-31').localeCompare(b.primary_upcoming_date ?? '9999-12-31'));

        this.hostRequests = overview.filter((item) => {
          if (item.event_type !== 'REQUEST') {
            return false;
          }

          if (!['new_request', 'accepted_by_host', 'host_proposed', 'artist_proposed', 'artist_accepted', 'approved', 'published'].includes(item.status)) {
            return false;
          }

          const isAssignedToHost = item.host_ids.some((hostId) => hostIds.has(hostId));
          const isAcceptedByCurrentHost = item.accepted_host_profile_ids.includes(currentUserId);

          return item.status === 'new_request'
            || item.status === 'artist_proposed'
            || (['accepted_by_host', 'host_proposed', 'artist_accepted', 'approved', 'published'].includes(item.status) && (isAssignedToHost || isAcceptedByCurrentHost));
        });

        this.privateLocations = locations;
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Artist dashboard could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  get isInvitedArtist(): boolean {
    return this.authService.isInvitedArtist;
  }

  get isArtistDashboard(): boolean {
    return (this.route.snapshot.data['title'] ?? 'Artist Workspace') === 'Dashboard'
      && this.authService.hasAnyRole(['Artist', 'Artist Invited'])
      && !this.authService.hasAnyRole(['Host', 'Host+']);
  }

  get isHostDashboard(): boolean {
    return (this.route.snapshot.data['title'] ?? 'Artist Workspace') === 'Dashboard'
      && this.authService.hasAnyRole(['Host', 'Host+'])
      && !this.authService.hasRole('Host Manager');
  }

  get title(): string {
    const routeTitle = this.route.snapshot.data['title'] ?? 'Artist Workspace';
    if (this.isInvitedArtist && routeTitle === 'Dashboard') {
      return 'Invited Artists Workspace';
    }

    return routeTitle;
  }

  get description(): string {
    const routeDescription = this.route.snapshot.data['description'] ?? 'Manage your artist workspace.';
    if (this.isInvitedArtist && this.title === 'Invited Artists Workspace') {
      return 'Manage your invited artist workspace, profile, media, messages, notifications, and availability.';
    }

    return routeDescription;
  }

  get unreadMessagesCount(): number {
    return this.conversations.reduce((sum, conversation) => sum + conversation.unread_count, 0);
  }

  // Human-friendly padded count for UI badges (e.g. 06)
  get unreadMessagesCountPadded(): string {
    const count = this.unreadMessagesCount;
    return count < 10 ? `0${count}` : `${count}`;
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter((notification) => !notification.is_read).length;
  }

  get newArtistRequestCount(): number {
    return this.hostRequests.filter((request) => request.status === 'new_request' || request.status === 'artist_proposed').length;
  }

  get engagedArtistRequestCount(): number {
    return this.hostRequests.filter((request) => request.status === 'accepted_by_host' || request.status === 'host_proposed').length;
  }

  get nextUpcomingEvent(): AdminEventOverviewItem | null {
    return this.upcomingEvents[0] ?? null;
  }

  getPrimaryDate(item: AdminEventOverviewItem): string | null {
    return item.selected_dates.slice().sort((a, b) => a.localeCompare(b))[0] ?? null;
  }

  get availabilityDaysCount(): number {
    const coveredDays = new Set<string>();

    for (const entry of this.availabilityEntries) {
      if (!entry.start_date || !entry.end_date) {
        continue;
      }

      let current = new Date(`${entry.start_date}T00:00:00`);
      const end = new Date(`${entry.end_date}T00:00:00`);

      while (current.getTime() <= end.getTime()) {
        coveredDays.add(this.toDateKey(current));
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
      }
    }

    return coveredDays.size;
  }

  get monthLabel(): string {
    return this.calendarCursor.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  get calendarDays(): CalendarDay[] {
    const monthStart = this.startOfMonth(this.calendarCursor);
    const firstGridDay = new Date(monthStart);
    const dayOffset = (monthStart.getDay() + 6) % 7;
    firstGridDay.setDate(monthStart.getDate() - dayOffset);

    const coveredDays = new Set(this.getAvailabilityDateKeys());
    const todayKey = this.toDateKey(new Date());

    return Array.from({ length: 35 }, (_, index) => {
      const day = new Date(firstGridDay);
      day.setDate(firstGridDay.getDate() + index);
      const dateKey = this.toDateKey(day);

      return {
        date: day,
        dateKey,
        dayNumber: day.getDate(),
        isCurrentMonth: day.getMonth() === monthStart.getMonth(),
        isToday: dateKey === todayKey,
        isAvailable: coveredDays.has(dateKey),
      };
    });
  }

  getAvailabilitySummary(entry: ArtistAvailabilityEntry): string {
    if (!entry.start_date || !entry.end_date) {
      return 'Date range incomplete';
    }

    const start = new Date(`${entry.start_date}T00:00:00`);
    const end = new Date(`${entry.end_date}T00:00:00`);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }

  previousMonth() {
    this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() - 1, 1);
  }

  nextMonth() {
    this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() + 1, 1);
  }

  trackByEvent(_: number, item: AdminEventOverviewItem) {
    return item.id;
  }

  trackByConversation(_: number, item: ArtistConversationSummary) {
    return `${item.other_user_id}::${item.subject}`;
  }

  trackByNotification(_: number, item: ArtistNotificationItem) {
    return item.id;
  }

  trackByRequest(_: number, item: ArtistRequestListItem) {
    return item.id;
  }

  trackByAvailability(index: number, item: ArtistAvailabilityEntry) {
    return item.id ?? `${item.start_date}-${item.end_date}-${index}`;
  }

  private isNotificationExpired(notification: ArtistNotificationItem): boolean {
    if (!notification.expires_at) {
      return false;
    }

    const expiresAt = new Date(notification.expires_at).getTime();
    return !Number.isNaN(expiresAt) && expiresAt < Date.now();
  }

  private getAvailabilityDateKeys(): string[] {
    const dateKeys: string[] = [];

    for (const entry of this.availabilityEntries) {
      if (!entry.start_date || !entry.end_date) {
        continue;
      }

      let current = new Date(`${entry.start_date}T00:00:00`);
      const end = new Date(`${entry.end_date}T00:00:00`);

      while (current.getTime() <= end.getTime()) {
        dateKeys.push(this.toDateKey(current));
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
      }
    }

    return dateKeys;
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private todayDateKey(): string {
    return this.toDateKey(new Date());
  }
}
