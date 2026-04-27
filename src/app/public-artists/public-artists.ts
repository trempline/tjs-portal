import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicTjsArtistItem, SupabaseService } from '../services/supabase.service';
import { SharedModule } from '../shared/shared-module';

type ArtistSort = 'upcoming' | 'name-asc';

@Component({
  selector: 'app-public-artists',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor, FormsModule],
  templateUrl: './public-artists.html',
})
export class PublicArtists implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = true;
  error = '';
  items: PublicTjsArtistItem[] = [];
  filteredItems: PublicTjsArtistItem[] = [];

  showFilters = false;
  showSort = false;

  searchQuery = '';
  selectedName = '';
  selectedInstrument = '';
  selectedPerformanceType = '';
  sortBy: ArtistSort = 'upcoming';

  names: string[] = [];
  instruments: string[] = [];
  performanceTypes: string[] = [];

  async ngOnInit() {
    this.isLoading = true;
    this.error = '';

    try {
      this.items = await this.supabase.getPublicTjsArtists();
      this.extractFilterOptions();
      this.applyFilters();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'TJS artists could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  get activeFilterCount(): number {
    return [
      this.searchQuery.trim(),
      this.selectedName,
      this.selectedInstrument,
      this.selectedPerformanceType,
    ].filter(Boolean).length;
  }

  get selectedFilterCount(): number {
    return [
      this.selectedName,
      this.selectedInstrument,
      this.selectedPerformanceType,
    ].filter(Boolean).length;
  }

  extractFilterOptions() {
    this.names = Array.from(new Set(this.items.map((item) => item.display_name))).sort((a, b) => a.localeCompare(b));
    this.instruments = Array.from(new Set(this.items.flatMap((item) => item.instruments))).sort((a, b) => a.localeCompare(b));
    this.performanceTypes = Array.from(new Set(this.items.flatMap((item) => item.performance_types))).sort((a, b) => a.localeCompare(b));
  }

  applyFilters() {
    let filtered = [...this.items];

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((item) => item.display_name.toLowerCase().includes(query));
    }

    if (this.selectedName) {
      filtered = filtered.filter((item) => item.display_name === this.selectedName);
    }

    if (this.selectedInstrument) {
      filtered = filtered.filter((item) => item.instruments.includes(this.selectedInstrument));
    }

    if (this.selectedPerformanceType) {
      filtered = filtered.filter((item) => item.performance_types.includes(this.selectedPerformanceType));
    }

    this.filteredItems = this.sortArtists(filtered);
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedName = '';
    this.selectedInstrument = '';
    this.selectedPerformanceType = '';
    this.sortBy = 'upcoming';
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

  openArtist(item: PublicTjsArtistItem) {
    this.router.navigate(['/artists', item.id]);
  }

  instrumentsLabel(item: PublicTjsArtistItem): string {
    return item.instruments.length > 0 ? item.instruments.join(', ') : 'Not specified';
  }

  performanceTypesLabel(item: PublicTjsArtistItem): string {
    return item.performance_types.length > 0 ? item.performance_types.join(', ') : 'Performance type TBA';
  }

  upcomingEventLabel(item: PublicTjsArtistItem): string {
    if (!item.next_event_date) {
      return 'No upcoming event scheduled';
    }

    const dateLabel = this.formatDate(item.next_event_date);
    return item.next_event_title ? `${dateLabel} - ${item.next_event_title}` : dateLabel;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'TJS';
    }

    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  }

  trackById(_: number, item: PublicTjsArtistItem) {
    return item.id;
  }

  private sortArtists(artists: PublicTjsArtistItem[]): PublicTjsArtistItem[] {
    const sorted = [...artists];

    if (this.sortBy === 'name-asc') {
      return sorted.sort((left, right) => left.display_name.localeCompare(right.display_name));
    }

    return sorted.sort((left, right) => {
      const leftDate = left.next_event_date ?? '9999-12-31';
      const rightDate = right.next_event_date ?? '9999-12-31';
      if (leftDate !== rightDate) {
        return leftDate.localeCompare(rightDate);
      }

      return left.display_name.localeCompare(right.display_name);
    });
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
  }
}
