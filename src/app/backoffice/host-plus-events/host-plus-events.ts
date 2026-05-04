import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  HostPlusExternalEventItem,
  HostPlusExternalEventScheduleEntry,
  SupabaseService,
  TjsHost,
  TjsHostPlusDatabaseSettings,
} from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-host-plus-events',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, RouterLink],
  templateUrl: './host-plus-events.html',
})
export class HostPlusEvents implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  hostId = 0;
  host: TjsHost | null = null;
  settings: TjsHostPlusDatabaseSettings | null = null;
  items: HostPlusExternalEventItem[] = [];
  sourceTable: 'events' | 'tjs_events' | null = null;
  searchQuery = '';
  selectedDomain = 'all';
  selectedEdition = 'all';
  selectedType = 'all';
  sortBy: 'date-desc' | 'date-asc' = 'date-desc';
  isLoading = true;
  error = '';
  isMemberWorkspace = false;

  async ngOnInit() {
    const routeHostId = await this.resolveHostId();
    if (!routeHostId) {
      this.isLoading = false;
      return;
    }

    this.hostId = routeHostId;
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    try {
      const [host, result] = await Promise.all([
        this.supabase.getHost(this.hostId),
        this.supabase.getHostPlusExternalEvents(this.hostId),
      ]);

      this.host = host;
      this.settings = result.settings;
      this.items = result.items;
      this.sourceTable = result.source_table;

      if (!host) {
        this.error = 'Host+ not found.';
      } else if (!host.is_host_plus) {
        this.error = 'This host is not marked as Host+.';
      } else if (result.error) {
        this.error = result.error;
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load Host+ events.';
    } finally {
      this.isLoading = false;
    }
  }

  get hostName(): string {
    return this.host?.public_name || this.host?.name || `Host+ #${this.hostId}`;
  }

  get backLink(): string {
    return this.isMemberWorkspace ? '/backoffice/host-plus/home' : '/backoffice/host-plus';
  }

  get backLabel(): string {
    return this.isMemberWorkspace ? 'Back to Host+ Home' : 'Back to Host+';
  }

  get databaseLabel(): string {
    return this.settings?.database_label || this.settings?.supabase_url || 'No database configured';
  }

  get sourceLabel(): string {
    if (this.sourceTable === 'events') {
      return 'External events table';
    }

    if (this.sourceTable === 'tjs_events') {
      return 'External tjs_events table';
    }

    return 'No source loaded';
  }

  get activeCount(): number {
    return this.items.filter((item) => item.is_active !== false).length;
  }

  get domainOptions(): string[] {
    return this.uniqueSortedOptions(this.items.map((item) => item.event_domain_name));
  }

  get editionOptions(): string[] {
    return this.uniqueSortedOptions(this.items.map((item) => item.edition_name));
  }

  get typeOptions(): string[] {
    return this.uniqueSortedOptions(this.items.map((item) => item.event_type_name));
  }

  get filteredEvents(): HostPlusExternalEventItem[] {
    const query = this.searchQuery.trim().toLowerCase();

    const filtered = this.items.filter((item) => {
      if (this.selectedDomain !== 'all' && (item.event_domain_name ?? '') !== this.selectedDomain) {
        return false;
      }

      if (this.selectedEdition !== 'all' && (item.edition_name ?? '') !== this.selectedEdition) {
        return false;
      }

      if (this.selectedType !== 'all' && (item.event_type_name ?? '') !== this.selectedType) {
        return false;
      }

      return !query || item.title.toLowerCase().includes(query);
    });

    return filtered.sort((left, right) => {
      const leftDate = left.primary_date ?? (this.sortBy === 'date-desc' ? '0000-00-00' : '9999-12-31');
      const rightDate = right.primary_date ?? (this.sortBy === 'date-desc' ? '0000-00-00' : '9999-12-31');
      if (leftDate !== rightDate) {
        return this.sortBy === 'date-desc'
          ? rightDate.localeCompare(leftDate)
          : leftDate.localeCompare(rightDate);
      }

      return (right.created_at ?? '').localeCompare(left.created_at ?? '');
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedDomain = 'all';
    this.selectedEdition = 'all';
    this.selectedType = 'all';
    this.sortBy = 'date-desc';
  }

  async openEvent(item: HostPlusExternalEventItem) {
    const route = this.isMemberWorkspace
      ? ['/backoffice/host-plus/events', item.id]
      : ['/backoffice/host-plus', this.hostId, 'events', item.id];
    await this.router.navigate(route);
  }

  visibleScheduleEntries(item: HostPlusExternalEventItem): HostPlusExternalEventScheduleEntry[] {
    return item.schedule_entries.slice(0, 3);
  }

  extraScheduleCount(item: HostPlusExternalEventItem): number {
    return Math.max(item.schedule_entries.length - 3, 0);
  }

  formatScheduleEntry(entry: HostPlusExternalEventScheduleEntry): string {
    const dateLabel = entry.start_date
      ? entry.end_date && entry.end_date !== entry.start_date
        ? `${entry.start_date} - ${entry.end_date}`
        : entry.start_date
      : 'No date';
    const timeLabel = entry.time ? `, ${entry.time}` : '';
    const locationLabel = entry.location_name ? `, ${entry.location_name}` : '';

    return `${dateLabel}${timeLabel}${locationLabel}`;
  }

  private uniqueSortedOptions(values: Array<string | null>): string[] {
    return Array.from(
      new Set(
        values
          .map((value) => value?.trim())
          .filter((value): value is string => !!value)
      )
    ).sort((left, right) => left.localeCompare(right));
  }

  private async resolveHostId(): Promise<number | null> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const routeHostId = Number(idParam);
      if (!Number.isFinite(routeHostId) || routeHostId <= 0) {
        this.error = 'Invalid Host+ id.';
        return null;
      }
      this.isMemberWorkspace = false;
      return routeHostId;
    }

    this.isMemberWorkspace = true;
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Host+ events could not be loaded.';
      return null;
    }

    const hosts = await this.supabase.getMyHosts(profileId);
    const host = hosts.find((item) => item.is_host_plus);
    if (!host) {
      this.error = 'No Host+ record is assigned to your account.';
      return null;
    }

    return host.id;
  }
}
