import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HostWorkspaceEventItem, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-host-events',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './host-events.html',
})
export class HostEvents implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = true;
  error = '';
  searchQuery = '';
  showSearch = false;
  showFilters = false;

  selectedDomain = 'all';
  selectedEdition = 'all';
  selectedInstrument = 'all';
  selectedArtist = 'all';
  selectedEventType = 'all';
  selectedStatus = 'all';

  items: HostWorkspaceEventItem[] = [];

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    try {
      await this.authService.waitForAuthReady();
      const profileId = this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
      if (!profileId) {
        this.error = 'Host events could not be loaded.';
        return;
      }

      this.items = await this.supabase.getHostWorkspaceEvents(profileId);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load host events.';
    } finally {
      this.isLoading = false;
    }
  }

  get filteredEvents() {
    const query = this.searchQuery.trim().toLowerCase();

    return this.items
      .filter((item) => {
        if (this.selectedDomain !== 'all' && item.event_domain_name !== this.selectedDomain) {
          return false;
        }

        if (this.selectedEdition !== 'all' && (item.edition ?? '') !== this.selectedEdition) {
          return false;
        }

        if (this.selectedInstrument !== 'all' && !item.instruments.includes(this.selectedInstrument)) {
          return false;
        }

        if (this.selectedArtist !== 'all' && !item.artist_names.includes(this.selectedArtist)) {
          return false;
        }

        if (this.selectedEventType !== 'all' && (item.event_type_name ?? '') !== this.selectedEventType) {
          return false;
        }

        if (this.selectedStatus !== 'all' && item.status !== this.selectedStatus) {
          return false;
        }

        if (!query) {
          return true;
        }

        const haystacks = [
          item.title,
          item.description ?? '',
          item.event_domain_name ?? '',
          item.edition ?? '',
          item.event_type_name ?? '',
          item.artist_names.join(' '),
          item.instruments.join(' '),
          this.statusLabel(item.status),
        ];

        return haystacks.some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const aDate = a.primary_upcoming_date ?? '9999-12-31';
        const bDate = b.primary_upcoming_date ?? '9999-12-31';
        if (aDate !== bDate) {
          return aDate.localeCompare(bDate);
        }

        return a.title.localeCompare(b.title);
      });
  }

  get domainOptions() {
    return Array.from(new Set(
      this.items
        .map((item) => item.event_domain_name)
        .filter((value): value is string => !!value)
    )).sort((a, b) => a.localeCompare(b));
  }

  get editionOptions() {
    return Array.from(new Set(
      this.items
        .map((item) => item.edition)
        .filter((value): value is string => !!value)
    )).sort((a, b) => a.localeCompare(b));
  }

  get instrumentOptions() {
    return Array.from(new Set(this.items.flatMap((item) => item.instruments))).sort((a, b) => a.localeCompare(b));
  }

  get artistOptions() {
    return Array.from(new Set(this.items.flatMap((item) => item.artist_names))).sort((a, b) => a.localeCompare(b));
  }

  get eventTypeOptions() {
    return Array.from(new Set(
      this.items
        .map((item) => item.event_type_name)
        .filter((value): value is string => !!value)
    )).sort((a, b) => a.localeCompare(b));
  }

  get statusOptions() {
    return Array.from(new Set(this.items.map((item) => item.status))).sort((a, b) => a.localeCompare(b));
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'SELECTED':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Active';
      case 'SELECTED':
        return 'Inactive';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  primaryArtist(item: HostWorkspaceEventItem): string {
    return item.artist_names[0] ?? 'Unassigned';
  }

  instrumentsLabel(item: HostWorkspaceEventItem): string {
    if (item.instruments.length === 0) {
      return 'No instruments';
    }

    if (item.instruments.length === 1) {
      return item.instruments[0];
    }

    return `${item.instruments[0]} +${item.instruments.length - 1}`;
  }

  async openEvent(item: HostWorkspaceEventItem) {
    await this.router.navigate(['/backoffice/host/events', item.id]);
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchQuery = '';
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearFilters() {
    this.selectedDomain = 'all';
    this.selectedEdition = 'all';
    this.selectedInstrument = 'all';
    this.selectedArtist = 'all';
    this.selectedEventType = 'all';
    this.selectedStatus = 'all';
  }

  get activeFilterCount(): number {
    return [
      this.selectedDomain,
      this.selectedEdition,
      this.selectedInstrument,
      this.selectedArtist,
      this.selectedEventType,
      this.selectedStatus,
    ].filter((value) => value !== 'all').length;
  }
}
