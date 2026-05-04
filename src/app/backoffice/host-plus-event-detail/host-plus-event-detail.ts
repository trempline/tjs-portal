import { DatePipe, Location, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HostPlusExternalEventItem,
  HostPlusExternalEventScheduleEntry,
  SupabaseService,
  TjsHost,
  TjsHostPlusDatabaseSettings,
} from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-host-plus-event-detail',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe],
  templateUrl: './host-plus-event-detail.html',
})
export class HostPlusEventDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  hostId = 0;
  eventId = '';
  host: TjsHost | null = null;
  settings: TjsHostPlusDatabaseSettings | null = null;
  event: HostPlusExternalEventItem | null = null;
  sourceTable: 'events' | 'tjs_events' | null = null;
  isLoading = true;
  error = '';
  isMemberWorkspace = false;

  async ngOnInit() {
    const routeEventId = this.route.snapshot.paramMap.get('eventId') ?? '';

    if (!routeEventId) {
      this.error = 'Event not found.';
      this.isLoading = false;
      return;
    }

    const routeHostId = await this.resolveHostId();
    if (!routeHostId) {
      this.isLoading = false;
      return;
    }

    this.hostId = routeHostId;
    this.eventId = routeEventId;
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
      this.sourceTable = result.source_table;
      this.event = result.items.find((item) => item.id === this.eventId) ?? null;

      if (!host) {
        this.error = 'Host+ not found.';
      } else if (!host.is_host_plus) {
        this.error = 'This host is not marked as Host+.';
      } else if (result.error) {
        this.error = result.error;
      } else if (!this.event) {
        this.error = 'Event not found in the configured Host+ database.';
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load Host+ event detail.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.location.back();
  }

  async createTjsEvent() {
    if (!this.event) {
      return;
    }

    const route = this.isMemberWorkspace
      ? ['/backoffice/host-plus/events', this.event.id, 'create-tjs']
      : ['/backoffice/host-plus', this.hostId, 'events', this.event.id, 'create-tjs'];
    await this.router.navigate(route);
  }

  get hostName(): string {
    return this.host?.public_name || this.host?.name || `Host+ #${this.hostId}`;
  }

  get databaseLabel(): string {
    return this.settings?.database_label || this.settings?.supabase_url || 'No database configured';
  }

  get detailTeaser(): string {
    return this.event?.teaser || this.event?.description || 'No teaser available.';
  }

  metadataLabel(value: string | null | undefined, fallback: string): string {
    return value?.trim() || fallback;
  }

  scheduleDateLabel(entry: HostPlusExternalEventScheduleEntry): string {
    return entry.start_date
      ? entry.end_date && entry.end_date !== entry.start_date
        ? `${entry.start_date} - ${entry.end_date}`
        : entry.start_date
      : 'No date';
  }

  scheduleTimeLabel(entry: HostPlusExternalEventScheduleEntry): string {
    return entry.time?.trim() || 'Time not set';
  }

  schedulePlaceLabel(entry: HostPlusExternalEventScheduleEntry): string {
    return entry.location_name?.trim() || 'Place not set';
  }

  trackByExternalArtistId(_: number, item: HostPlusExternalEventItem['artists'][number]) {
    return item.id;
  }

  private async resolveHostId(): Promise<number | null> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const routeHostId = Number(idParam);
      if (!Number.isFinite(routeHostId) || routeHostId <= 0) {
        this.error = 'Event not found.';
        return null;
      }
      this.isMemberWorkspace = false;
      return routeHostId;
    }

    this.isMemberWorkspace = true;
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Event could not be loaded.';
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
