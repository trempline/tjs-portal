import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../shared/shared-module';
import { PublicWebsiteEventItem, SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-public-events',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor, FormsModule],
  templateUrl: './public-events.html',
})
export class PublicEvents implements OnInit {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = true;
  error = '';
  items: PublicWebsiteEventItem[] = [];
  filteredItems: PublicWebsiteEventItem[] = [];
  expandedEventId: string | null = null;
  showMemberOnlyPopup = false;
  lockedEventTitle = '';

  showFilters = false;
  showSort = false;

  searchQuery = '';
  selectedDomain = '';
  selectedInstrument = '';
  selectedArtist = '';
  selectedEventType = '';
  selectedLocation = '';
  selectedMembersOnly = false;
  sortBy = 'date-asc';

  domains: string[] = [];
  instruments: string[] = [];
  artists: string[] = [];
  eventTypes: string[] = [];
  locations: string[] = [];

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    this.isLoading = true;
    this.error = '';

    try {
      this.items = await this.supabase.getPublicWebsiteEvents();
      this.extractFilterOptions();
      this.applyFilters();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Published events could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  extractFilterOptions() {
    this.domains = Array.from(new Set(this.items.map(item => item.event_domain_name).filter(Boolean) as string[])).sort();
    this.instruments = Array.from(new Set(this.items.flatMap(item => item.instruments))).sort();
    this.artists = Array.from(new Set(this.items.flatMap(item => item.artist_names))).sort();
    this.eventTypes = Array.from(new Set(this.items.map(item => item.event_type_name).filter(Boolean) as string[])).sort();
    this.locations = Array.from(new Set(this.items.flatMap(item => this.extractLocations(item)))).sort();
  }

  extractLocations(item: PublicWebsiteEventItem): string[] {
    return item.schedule_lines
      .map(line => {
        const match = line.match(/at (.+)$/);
        return match ? match[1].trim() : null;
      })
      .filter(Boolean) as string[];
  }

  applyFilters() {
    let filtered = [...this.items];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.title.toLowerCase().includes(query));
    }

    if (this.selectedDomain) {
      filtered = filtered.filter(item => item.event_domain_name === this.selectedDomain);
    }

    if (this.selectedInstrument) {
      filtered = filtered.filter(item => item.instruments.includes(this.selectedInstrument));
    }

    if (this.selectedArtist) {
      filtered = filtered.filter(item => item.artist_names.includes(this.selectedArtist));
    }

    if (this.selectedEventType) {
      filtered = filtered.filter(item => item.event_type_name === this.selectedEventType);
    }

    if (this.selectedLocation) {
      filtered = filtered.filter(item => this.extractLocations(item).includes(this.selectedLocation));
    }

    if (this.selectedMembersOnly) {
      filtered = filtered.filter(item => item.is_member_only);
    }

    filtered = this.sortEvents(filtered);
    this.filteredItems = filtered;
  }

  sortEvents(events: PublicWebsiteEventItem[]): PublicWebsiteEventItem[] {
    const sorted = [...events];
    const compareByUpcomingStatus = (left: PublicWebsiteEventItem, right: PublicWebsiteEventItem) => {
      const leftIsPast = this.isPastEvent(left);
      const rightIsPast = this.isPastEvent(right);

      if (leftIsPast === rightIsPast) {
        return 0;
      }

      return leftIsPast ? 1 : -1;
    };

    switch (this.sortBy) {
      case 'title-asc':
        return sorted.sort((a, b) =>
          compareByUpcomingStatus(a, b) || a.title.localeCompare(b.title)
        );
      case 'title-desc':
        return sorted.sort((a, b) =>
          compareByUpcomingStatus(a, b) || b.title.localeCompare(a.title)
        );
      case 'date-asc':
        return sorted.sort((a, b) =>
          compareByUpcomingStatus(a, b)
          || (a.primary_date || '9999-12-31').localeCompare(b.primary_date || '9999-12-31')
        );
      case 'date-desc':
        return sorted.sort((a, b) =>
          compareByUpcomingStatus(a, b)
          || (b.primary_date || '0000-00-00').localeCompare(a.primary_date || '0000-00-00')
        );
      default:
        return sorted.sort(compareByUpcomingStatus);
    }
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedDomain = '';
    this.selectedInstrument = '';
    this.selectedArtist = '';
    this.selectedEventType = '';
    this.selectedLocation = '';
    this.selectedMembersOnly = false;
    this.sortBy = 'date-asc';
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    if (this.showFilters) {
      this.showSort = false;
    }
  }

  toggleSort() {
    this.showSort = !this.showSort;
    if (this.showSort) {
      this.showFilters = false;
    }
  }

  formatArtists(names: string[]): string {
    if (names.length === 0) {
      return 'Artist to be announced';
    }

    if (names.length === 1) {
      return names[0];
    }

    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }

    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
  }

  formatScheduleLine(line: string): string {
    // Format: "2026-04-17 - 2026-04-18 : 14:00 | Location TBA"
    // or: "2026-05-01 : 20:00 | Moses Dearm"
    
    const parts = line.split('|').map(p => p.trim());
    const dateTimePart = parts[0] || '';
    const locationPart = parts[1] || '';
    
    // Split date and time by colon
    const dateTimeSegments = dateTimePart.split(':').map(s => s.trim());
    const datePart = dateTimeSegments[0] || '';
    const timePart = dateTimeSegments.length > 1 ? dateTimeSegments.slice(1).join(':').trim() : '';
    
    let formatted = `📅 ${datePart}`;
    
    if (timePart) {
      formatted += ` • 🕐 ${timePart}`;
    }
    
    if (locationPart) {
      formatted += ` • 📍 ${locationPart}`;
    }
    
    return formatted;
  }

  instrumentsLabel(instruments: string[]): string {
    return instruments.length > 0 ? instruments.join(', ') : 'Not specified';
  }

  scheduleLines(item: PublicWebsiteEventItem): string[] {
    return item.schedule_lines;
  }

  visibleScheduleLines(item: PublicWebsiteEventItem): string[] {
    return item.schedule_lines.slice(0, 2);
  }

  hasMoreScheduleLines(item: PublicWebsiteEventItem): boolean {
    return item.schedule_lines.length > 2;
  }

  hiddenScheduleLines(item: PublicWebsiteEventItem): string[] {
    return item.schedule_lines.slice(2);
  }

  isExpanded(item: PublicWebsiteEventItem): boolean {
    return this.expandedEventId === item.id;
  }

  toggleExpanded(item: PublicWebsiteEventItem) {
    this.expandedEventId = this.expandedEventId === item.id ? null : item.id;
  }

  get canAccessMemberOnlyEvents(): boolean {
    return this.authService.hasValidMembership
      || this.authService.isAdmin
      || this.authService.isCommitteeMember
      || this.authService.isHostManager
      || this.authService.hasAnyRole(['Host', 'Host+'])
      || this.authService.isArtist;
  }

  isPastEvent(item: PublicWebsiteEventItem): boolean {
    const comparisonDate = item.last_date || item.primary_date;
    if (!comparisonDate) {
      return false;
    }

    return new Date(`${comparisonDate}T23:59:59`).getTime() < new Date().getTime();
  }

  isLockedMemberOnlyEvent(item: PublicWebsiteEventItem): boolean {
    return item.is_member_only && !this.canAccessMemberOnlyEvents;
  }

  async openEvent(item: PublicWebsiteEventItem) {
    if (this.isLockedMemberOnlyEvent(item)) {
      this.lockedEventTitle = item.title;
      this.showMemberOnlyPopup = true;
      return;
    }

    await this.router.navigate(['/events', item.id]);
  }

  closeMemberOnlyPopup() {
    this.showMemberOnlyPopup = false;
    this.lockedEventTitle = '';
  }

  async goToMemberLogin() {
    this.closeMemberOnlyPopup();
    await this.router.navigate(['/member-login'], {
      queryParams: { returnUrl: this.router.url || '/events' },
    });
  }
}
