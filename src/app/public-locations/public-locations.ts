import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicLocationItem, SupabaseService } from '../services/supabase.service';
import { SharedModule } from '../shared/shared-module';

type LocationSort = 'name-asc' | 'city-asc';
type VisibilityFilter = '' | 'public' | 'private';

@Component({
  selector: 'app-public-locations',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor, FormsModule],
  templateUrl: './public-locations.html',
})
export class PublicLocations implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = true;
  error = '';
  items: PublicLocationItem[] = [];
  filteredItems: PublicLocationItem[] = [];

  showFilters = false;
  showSort = false;

  searchQuery = '';
  selectedCity = '';
  selectedType = '';
  selectedVisibility: VisibilityFilter = '';
  sortBy: LocationSort = 'name-asc';

  cities: string[] = [];
  locationTypes: string[] = [];

  async ngOnInit() {
    this.isLoading = true;
    this.error = '';

    try {
      this.items = await this.supabase.getPublicWebsiteLocations();
      this.extractFilterOptions();
      this.applyFilters();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Locations could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  get selectedFilterCount(): number {
    return [this.selectedCity, this.selectedType, this.selectedVisibility].filter(Boolean).length;
  }

  extractFilterOptions() {
    this.cities = Array.from(
      new Set(this.items.map((item) => item.city).filter((value): value is string => !!value))
    ).sort((left, right) => left.localeCompare(right));
    this.locationTypes = Array.from(
      new Set(this.items.map((item) => item.location_type_name).filter((value): value is string => !!value))
    ).sort((left, right) => left.localeCompare(right));
  }

  applyFilters() {
    let filtered = [...this.items];
    const query = this.searchQuery.trim().toLowerCase();

    if (query) {
      filtered = filtered.filter((item) =>
        [item.name, item.city, item.country, item.address, item.location_type_name, item.host_name]
          .filter((value): value is string => !!value)
          .some((value) => value.toLowerCase().includes(query))
      );
    }

    if (this.selectedCity) {
      filtered = filtered.filter((item) => item.city === this.selectedCity);
    }

    if (this.selectedType) {
      filtered = filtered.filter((item) => item.location_type_name === this.selectedType);
    }

    if (this.selectedVisibility === 'private') {
      filtered = filtered.filter((item) => item.is_private);
    } else if (this.selectedVisibility === 'public') {
      filtered = filtered.filter((item) => !item.is_private);
    }

    this.filteredItems = this.sortLocations(filtered);
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCity = '';
    this.selectedType = '';
    this.selectedVisibility = '';
    this.sortBy = 'name-asc';
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

  locationLabel(item: PublicLocationItem): string {
    return item.is_private ? 'Private Location' : 'Public Location';
  }

  addressLabel(item: PublicLocationItem): string {
    return [item.address, item.city, item.country].filter(Boolean).join(', ') || 'Address TBA';
  }

  featureLabel(item: PublicLocationItem): string {
    const features = [...item.amenities, ...item.specs];
    return features.length > 0 ? features.slice(0, 3).join(', ') : 'Amenities TBA';
  }

  openLocation(item: PublicLocationItem) {
    this.router.navigate(['/locations', item.id]);
  }

  trackByLocation(_: number, item: PublicLocationItem) {
    return `${item.is_private ? 'private' : 'public'}:${item.id}`;
  }

  private sortLocations(locations: PublicLocationItem[]): PublicLocationItem[] {
    const sorted = [...locations];

    if (this.sortBy === 'city-asc') {
      return sorted.sort((left, right) =>
        (left.city ?? 'zzz').localeCompare(right.city ?? 'zzz')
        || left.name.localeCompare(right.name)
      );
    }

    return sorted.sort((left, right) => left.name.localeCompare(right.name));
  }
}
