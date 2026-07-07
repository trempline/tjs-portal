import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicLocationDetail as PublicLocationDetailData, PublicLocationUpcomingEvent, SupabaseService } from '../services/supabase.service';
import { SharedModule } from '../shared/shared-module';
import { ImageCopyrightTag } from '../shared/image-copyright/image-copyright-tag';
import { formatFrenchPublicDatePart, parsePublicScheduleLine } from '../shared/date-format/date-format.util';

@Component({
  selector: 'app-public-location-detail',
  standalone: true,
  imports: [SharedModule, NgIf, NgFor, ImageCopyrightTag],
  templateUrl: './public-location-detail.html',
})
export class PublicLocationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private supabase = inject(SupabaseService);

  isLoading = true;
  error = '';
  location: PublicLocationDetailData | null = null;
  mapEmbedUrl: SafeResourceUrl | null = null;
  directionsUrl = '';

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
      this.configureLocationMap();
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

  formatHosts(names: string[]): string {
    if (names.length === 0) {
      return 'Host to be announced';
    }

    if (names.length === 1) {
      return names[0];
    }

    return names.join(', ');
  }

  formatScheduleLine(line: string): string {
    const { datePart, timePart, locationPart } = this.parseScheduleLine(line);
    const formattedDate = formatFrenchPublicDatePart(datePart);
    return [formattedDate, timePart, locationPart].filter(Boolean).join(' - ');
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

  private configureLocationMap() {
    const coordinates = this.locationCoordinates();
    if (!coordinates) {
      this.mapEmbedUrl = null;
      this.directionsUrl = '';
      return;
    }

    const latitude = coordinates.lat.toFixed(6);
    const longitude = coordinates.long.toFixed(6);
    const mapPadding = 0.01;
    const bbox = [
      coordinates.long - mapPadding,
      coordinates.lat - mapPadding,
      coordinates.long + mapPadding,
      coordinates.lat + mapPadding,
    ].map((value) => value.toFixed(6)).join('%2C');

    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`
    );
    this.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  private locationCoordinates(): { lat: number; long: number } | null {
    const lat = this.coordinateNumber(this.location?.lat);
    const long = this.coordinateNumber(this.location?.long);

    if (lat === null || long === null || lat < -90 || lat > 90 || long < -180 || long > 180) {
      return null;
    }

    return { lat, long };
  }

  private coordinateNumber(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private parseScheduleLine(line: string): { datePart: string; timePart: string; locationPart: string } {
    return parsePublicScheduleLine(line);
  }
}
