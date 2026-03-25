import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminEventOverviewItem, SupabaseService } from '../../services/supabase.service';

type OverviewTab = 'all' | 'requests' | 'events';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private supabase = inject(SupabaseService);

  isLoading = true;
  error = '';
  activeTab: OverviewTab = 'all';
  searchQuery = '';
  items: AdminEventOverviewItem[] = [];
  readonly dummyItems: AdminEventOverviewItem[] = [
    {
      id: 'demo-request-1',
      title: 'Salon recital for spring donors',
      description: 'Private donor evening in central Paris.',
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
      host_names: [],
      host_statuses: [],
      selected_dates: [],
    },
    {
      id: 'demo-request-2',
      title: 'Family chamber concert request',
      description: 'Small-format performance request for a private home.',
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
      host_names: [],
      host_statuses: [],
      selected_dates: [],
    },
    {
      id: 'demo-request-3',
      title: 'Summer terrace showcase',
      description: 'Open-air request awaiting committee validation.',
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
      host_names: ['Maison du Port'],
      host_statuses: ['CONFIRMED'],
      selected_dates: ['2026-06-21'],
    },
    {
      id: 'demo-event-1',
      title: 'Beethoven Evening at Villa TJS',
      description: 'Confirmed concert instance created from an approved request.',
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
      host_names: ['Maison du Port'],
      host_statuses: ['CONFIRMED'],
      selected_dates: ['2026-06-21'],
    },
    {
      id: 'demo-event-2',
      title: 'Young Artists Showcase',
      description: 'Host selected event instance still in progress.',
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
      host_names: ['Hotel des Artistes'],
      host_statuses: ['PENDING'],
      selected_dates: ['2026-05-03'],
    },
    {
      id: 'demo-event-3',
      title: 'Winter Benefit Recital',
      description: 'Completed event retained for full admin visibility.',
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
      host_names: ['Chateau Rive Gauche'],
      host_statuses: ['CONFIRMED'],
      selected_dates: ['2026-01-30'],
    },
  ];

  async ngOnInit() {
    await this.loadOverview();
  }

  async loadOverview() {
    this.isLoading = true;
    this.error = '';
    const liveItems = await this.supabase.getAdminEventOverview();
    this.items = liveItems.length > 0 ? liveItems : this.dummyItems;
    this.isLoading = false;
  }

  setTab(tab: OverviewTab) {
    this.activeTab = tab;
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

  get statusSummary() {
    const summary = new Map<string, number>();
    for (const item of this.items) {
      summary.set(item.status, (summary.get(item.status) ?? 0) + 1);
    }

    return Array.from(summary.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
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

      if (!q) {
        return true;
      }

      const haystacks = [
        item.title,
        item.status,
        item.origin_website,
        item.creator_name,
        item.creator_email,
        item.city ?? '',
        item.department ?? '',
        item.host_names.join(' '),
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

  typeLabel(item: AdminEventOverviewItem): string {
    return item.event_type === 'REQUEST' ? 'Request' : 'Event';
  }

  primaryDate(item: AdminEventOverviewItem): string | null {
    if (item.event_type === 'REQUEST') {
      return item.proposed_dates?.[0] ?? null;
    }

    return item.selected_dates[0] ?? null;
  }
}
