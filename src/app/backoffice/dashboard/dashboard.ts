import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  AdminEventOverviewItem,
  MembershipPaymentRecord,
  SupabaseService,
  TjsArtist,
  TjsUserWithRoles,
} from '../../services/supabase.service';

interface StatCard {
  label: string;
  value: number;
  hint: string;
  route?: string;
  tone: string;
}

interface MonthlySeriesPoint {
  label: string;
  value: number;
  accepted: number;
  rejected: number;
  height: number;
  acceptedHeight: number;
  rejectedHeight: number;
}

interface UpcomingEventItem {
  id: string;
  title: string;
  date: string;
  city: string | null;
  hostName: string | null;
}

interface ExpiringMembershipItem {
  id: string;
  name: string;
  email: string;
  memberUntil: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, NgFor, NgIf, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  isLoading = true;
  error = '';

  artists: TjsArtist[] = [];
  overviewItems: AdminEventOverviewItem[] = [];
  membershipUsers: TjsUserWithRoles[] = [];
  membershipPayments: MembershipPaymentRecord[] = [];
  publicLocationCount = 0;
  privateLocationCount = 0;

  async ngOnInit() {
    await this.loadDashboard();
  }

  async loadDashboard() {
    this.isLoading = true;
    this.error = '';

    const currentUserId = this.authService.currentUser?.id ?? '';
    if (currentUserId) {
      const syncResult = await this.supabase.syncExpiredMemberships(currentUserId);
      if (syncResult.error) {
        this.error = syncResult.error;
      }
    }

    try {
      const [artists, overviewItems, membershipUsers, membershipPayments, publicLocations, privateLocations, hosts] = await Promise.all([
        this.supabase.getArtists(),
        this.supabase.getAdminEventOverview(),
        this.supabase.listAllUsersWithRoles(),
        this.supabase.listMembershipPayments(5000),
        this.supabase.getPublicLocations(),
        this.supabase.getAllPrivateLocations(),
        this.supabase.getHosts(),
      ]);

      this.artists = artists;
      this.overviewItems = overviewItems;
      this.membershipUsers = membershipUsers;
      this.membershipPayments = membershipPayments;
      this.publicLocationCount = publicLocations.length;
      this.privateLocationCount = privateLocations.length;
      this.hostCountValue = hosts.length;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load admin dashboard.';
    } finally {
      this.isLoading = false;
    }
  }

  private hostCountValue = 0;

  get statCards(): StatCard[] {
    return [
      {
        label: 'TJS Artists',
        value: this.tjsArtistCount,
        hint: 'Active TJS artist records',
        route: '/backoffice/artists/tjs',
        tone: 'border-rose-200 bg-rose-50 text-rose-700',
      },
      {
        label: 'Hosts',
        value: this.hostCountValue,
        hint: 'Registered host profiles',
        route: '/backoffice/hosts',
        tone: 'border-sky-200 bg-sky-50 text-sky-700',
      },
      {
        label: 'New Artist Requests',
        value: this.newArtistRequestCount,
        hint: 'Fresh requests awaiting progression',
        route: '/backoffice/event-requests',
        tone: 'border-amber-200 bg-amber-50 text-amber-700',
      },
      {
        label: 'In Progress Requests',
        value: this.unpublishedRequestCount,
        hint: 'Not new, not published, not rejected',
        route: '/backoffice/event-requests',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      },
    ];
  }

  get tjsArtistCount(): number {
    return this.artists.filter((artist) => artist.is_tjs_artist).length;
  }

  get requestItems(): AdminEventOverviewItem[] {
    return this.overviewItems.filter((item) => item.event_type === 'REQUEST');
  }

  get eventItems(): AdminEventOverviewItem[] {
    return this.overviewItems.filter((item) => item.event_type === 'EVENT_INSTANCE');
  }

  get newArtistRequestCount(): number {
    return this.requestItems.filter((item) => item.status === 'new_request').length;
  }

  get unpublishedRequestCount(): number {
    return this.requestItems.filter((item) => !['new_request', 'published', 'rejected'].includes(item.status)).length;
  }

  get upcomingEvents(): UpcomingEventItem[] {
    return this.eventItems
      .map((item) => {
        const date = this.nextUpcomingDate(item.selected_dates);
        if (!date || ['CANCELLED', 'COMPLETED'].includes(item.status)) {
          return null;
        }

        return {
          id: item.id,
          title: item.title,
          date,
          city: item.city ?? null,
          hostName: this.primaryHostName(item),
        };
      })
      .filter((item): item is UpcomingEventItem => item !== null)
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(0, 6);
  }

  get totalLocations(): number {
    return this.publicLocationCount + this.privateLocationCount;
  }

  get eventMonthlySeries(): MonthlySeriesPoint[] {
    const buckets = this.createMonthBuckets();
    const counts = new Map<string, number>();

    for (const item of this.eventItems) {
      if (['CANCELLED', 'COMPLETED'].includes(item.status)) {
        continue;
      }

      const months = new Set(
        (item.selected_dates ?? [])
          .filter(Boolean)
          .map((date) => this.monthKey(date))
          .filter((key) => buckets.some((bucket) => bucket.key === key))
      );

      for (const month of months) {
        counts.set(month, (counts.get(month) ?? 0) + 1);
      }
    }

    const maxValue = Math.max(...buckets.map((bucket) => counts.get(bucket.key) ?? 0), 1);
    return buckets.map((bucket) => {
      const value = counts.get(bucket.key) ?? 0;
      return {
        label: bucket.label,
        value,
        accepted: 0,
        rejected: 0,
        height: this.scale(value, maxValue),
        acceptedHeight: 0,
        rejectedHeight: 0,
      };
    });
  }

  get requestOutcomeSeries(): MonthlySeriesPoint[] {
    const buckets = this.createMonthBuckets();
    const acceptedCounts = new Map<string, number>();
    const rejectedCounts = new Map<string, number>();

    for (const item of this.requestItems) {
      const key = this.monthKey(item.created_at);
      if (!buckets.some((bucket) => bucket.key === key)) {
        continue;
      }

      if (this.isAcceptedRequestStatus(item.status)) {
        acceptedCounts.set(key, (acceptedCounts.get(key) ?? 0) + 1);
      } else if (item.status === 'rejected') {
        rejectedCounts.set(key, (rejectedCounts.get(key) ?? 0) + 1);
      }
    }

    const maxValue = Math.max(
      ...buckets.map((bucket) => Math.max(acceptedCounts.get(bucket.key) ?? 0, rejectedCounts.get(bucket.key) ?? 0)),
      1,
    );

    return buckets.map((bucket) => {
      const accepted = acceptedCounts.get(bucket.key) ?? 0;
      const rejected = rejectedCounts.get(bucket.key) ?? 0;
      return {
        label: bucket.label,
        value: 0,
        accepted,
        rejected,
        height: 0,
        acceptedHeight: this.scale(accepted, maxValue),
        rejectedHeight: this.scale(rejected, maxValue),
      };
    });
  }

  get membershipSeries(): MonthlySeriesPoint[] {
    const buckets = this.createMonthBuckets();
    const counts = new Map<string, number>();

    for (const payment of this.membershipPayments) {
      const key = this.monthKey(payment.payment_date);
      if (!buckets.some((bucket) => bucket.key === key)) {
        continue;
      }

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const maxValue = Math.max(...buckets.map((bucket) => counts.get(bucket.key) ?? 0), 1);
    return buckets.map((bucket) => {
      const value = counts.get(bucket.key) ?? 0;
      return {
        label: bucket.label,
        value,
        accepted: 0,
        rejected: 0,
        height: this.scale(value, maxValue),
        acceptedHeight: 0,
        rejectedHeight: 0,
      };
    });
  }

  get totalMembers(): number {
    return this.membershipUsers.filter((user) => this.membershipStatus(user) === 'active').length;
  }

  get expiringThisMonthCount(): number {
    return this.expiringThisMonth.length;
  }

  get expiringThisMonth(): ExpiringMembershipItem[] {
    const now = new Date();

    return this.membershipUsers
      .filter((user) => {
        if (!user.member_until || this.membershipStatus(user) !== 'active') {
          return false;
        }

        const expiryDate = this.parseDateOnly(user.member_until);
        return expiryDate.getMonth() === now.getMonth() && expiryDate.getFullYear() === now.getFullYear();
      })
      .sort((left, right) => left.member_until!.localeCompare(right.member_until!))
      .slice(0, 6)
      .map((user) => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
        memberUntil: user.member_until!,
      }));
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

  private isAcceptedRequestStatus(status: string): boolean {
    return ['accepted_by_host', 'host_proposed', 'artist_proposed', 'artist_accepted', 'approved', 'published'].includes(status);
  }

  private primaryHostName(item: AdminEventOverviewItem): string | null {
    return item.host_names[0] ?? null;
  }

  private nextUpcomingDate(dates: string[]): string | null {
    const today = this.todayDateString();
    return [...dates].sort((left, right) => left.localeCompare(right)).find((date) => date >= today) ?? null;
  }

  private createMonthBuckets(): Array<{ key: string; label: string }> {
    const formatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
    const now = new Date();
    const buckets: Array<{ key: string; label: string }> = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      buckets.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: formatter.format(date),
      });
    }

    return buckets;
  }

  private monthKey(value: string): string {
    return value.slice(0, 7);
  }

  private scale(value: number, max: number): number {
    return value === 0 ? 10 : Math.max(18, Math.round((value / max) * 100));
  }

  private parseDateOnly(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }

  private todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
