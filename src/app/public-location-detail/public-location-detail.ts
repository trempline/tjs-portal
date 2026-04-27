import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicLocationDetail as PublicLocationDetailData, PublicLocationUpcomingEvent, SupabaseService } from '../services/supabase.service';
import { SharedModule } from '../shared/shared-module';

@Component({
  selector: 'app-public-location-detail',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor],
  templateUrl: './public-location-detail.html',
})
export class PublicLocationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(SupabaseService);

  isLoading = true;
  error = '';
  location: PublicLocationDetailData | null = null;
  selectedImageUrl: string | null = null;

  async ngOnInit() {
    const locationId = this.route.snapshot.paramMap.get('id');
    if (!locationId) {
      this.error = 'Location not found.';
      this.isLoading = false;
      return;
    }

    try {
      this.location = await this.supabase.getPublicWebsiteLocationDetail(locationId);
      if (!this.location) {
        this.error = 'Location not found.';
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Location could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/locations']);
  }

  openEvent(event: PublicLocationUpcomingEvent) {
    this.router.navigate(['/events', event.id]);
  }

  openGalleryImage(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
  }

  closeGalleryImage() {
    this.selectedImageUrl = null;
  }

  get heroEyebrow(): string {
    return this.location?.location_type_name || this.locationLabel();
  }

  locationLabel(): string {
    if (!this.location) {
      return 'Location';
    }

    return this.location.is_private ? 'Private Location' : 'Public Location';
  }

  addressLabel(): string {
    if (!this.location) {
      return '';
    }

    return [this.location.address, this.location.city, this.location.country].filter(Boolean).join(', ') || 'Address TBA';
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
    const { datePart, timePart, locationPart } = this.parseScheduleLine(line);
    return [datePart, timePart, locationPart].filter(Boolean).join(' - ');
  }

  primaryScheduleLine(event: PublicLocationUpcomingEvent): string {
    return event.schedule_lines[0] ? this.formatScheduleLine(event.schedule_lines[0]) : 'Schedule TBA';
  }

  remainingScheduleCount(event: PublicLocationUpcomingEvent): number {
    return Math.max(event.schedule_lines.length - 1, 0);
  }

  websiteLabel(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  hasContactInfo(): boolean {
    return !!(this.location?.phone || this.location?.email || this.location?.website);
  }

  private parseScheduleLine(line: string): { datePart: string; timePart: string; locationPart: string } {
    const parts = line.split('|').map((part) => part.trim());
    const dateTimePart = parts[0] || '';
    const locationPart = parts[1] || '';
    const separatorIndex = dateTimePart.lastIndexOf(' : ');

    return {
      datePart: separatorIndex >= 0 ? dateTimePart.slice(0, separatorIndex).trim() : dateTimePart,
      timePart: separatorIndex >= 0 ? dateTimePart.slice(separatorIndex + 3).trim() : '',
      locationPart,
    };
  }
}
