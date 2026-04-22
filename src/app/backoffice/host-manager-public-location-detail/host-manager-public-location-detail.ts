import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HostPrivateLocationBookingItem, SaveTjsLocationInput, SupabaseService, TjsLocation } from '../../services/supabase.service';

interface PublicLocationCalendarDay {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  bookings: HostPrivateLocationBookingItem[];
}

@Component({
  selector: 'app-host-manager-public-location-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './host-manager-public-location-detail.html',
})
export class HostManagerPublicLocationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isUpdatingStatus = false;
  error = '';
  successMessage = '';
  location: TjsLocation | null = null;
  zoomedImageUrl: string | null = null;
  bookings: HostPrivateLocationBookingItem[] = [];
  calendarMonth = this.startOfMonth(new Date());

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const locationId = this.route.snapshot.paramMap.get('id');
    if (!locationId) {
      this.error = 'Public location not found.';
      this.isLoading = false;
      return;
    }

    const [location, bookings] = await Promise.all([
      this.supabase.getPublicLocationById(locationId, this.filterOwnerId),
      this.supabase.getHostPrivateLocationBookings(this.authService.isAdmin ? undefined : this.currentUserId, locationId),
    ]);
    if (!location) {
      this.error = 'Public location not found.';
      this.isLoading = false;
      return;
    }

    this.location = location;
    this.bookings = bookings;
    this.isLoading = false;
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get backRoute(): string {
    if (this.authService.isAdmin) {
      return '/backoffice/locations/public';
    }

    if (this.authService.isCommitteeMember) {
      return '/backoffice/committee/locations/public';
    }

    if (this.authService.isHostManager) {
      return '/backoffice/host-manager/locations/public';
    }

    return '/backoffice/host/locations/public';
  }

  get canManageLocations(): boolean {
    return this.authService.isAdmin || this.authService.isCommitteeMember || this.authService.isHostManager;
  }

  get shouldHideBookingDetails(): boolean {
    return !this.canManageLocations;
  }

  async toggleLocationStatus() {
    if (!this.location || this.isUpdatingStatus || !this.canManageLocations) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isUpdatingStatus = true;

    const nextStatus = !this.location.is_active;
    const error = await this.supabase.updateLocation(this.location.id, this.buildSavePayload(this.location, nextStatus));

    if (error) {
      this.error = error;
      this.isUpdatingStatus = false;
      return;
    }

    this.location = {
      ...this.location,
      is_active: nextStatus,
    };
    this.successMessage = `Location marked as ${nextStatus ? 'active' : 'inactive'}.`;
    this.isUpdatingStatus = false;
  }

  trackByImage(index: number, image: { id: string; image_url: string }) {
    return image.id || `${index}:${image.image_url}`;
  }

  trackById(_: number, item: { id: number }) {
    return item.id;
  }

  openImageZoom(imageUrl: string) {
    this.zoomedImageUrl = imageUrl;
  }

  closeImageZoom() {
    this.zoomedImageUrl = null;
  }

  get monthLabel(): string {
    return this.calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  get calendarDays(): PublicLocationCalendarDay[] {
    const firstDay = this.startOfMonth(this.calendarMonth);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    const days: PublicLocationCalendarDay[] = [];
    const today = new Date().toISOString().slice(0, 10);
    for (let index = 0; index < 42; index += 1) {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      const dateLabel = current.toISOString().slice(0, 10);

      days.push({
        date: dateLabel,
        dayNumber: current.getDate(),
        inCurrentMonth: current.getMonth() === this.calendarMonth.getMonth() && current.getFullYear() === this.calendarMonth.getFullYear(),
        isToday: dateLabel === today,
        bookings: this.bookings.filter((booking) => booking.booked_dates.includes(dateLabel)),
      });
    }

    return days;
  }

  previousMonth() {
    const next = new Date(this.calendarMonth);
    next.setMonth(next.getMonth() - 1);
    this.calendarMonth = this.startOfMonth(next);
  }

  nextMonth() {
    const next = new Date(this.calendarMonth);
    next.setMonth(next.getMonth() + 1);
    this.calendarMonth = this.startOfMonth(next);
  }

  trackByCalendarDate(_: number, day: PublicLocationCalendarDay) {
    return day.date;
  }

  trackByBooking(_: number, booking: HostPrivateLocationBookingItem) {
    return booking.event_id;
  }

  private get filterOwnerId(): string | undefined {
    return this.authService.isAdmin || this.authService.isCommitteeMember || this.authService.isHostManager
      ? undefined
      : this.currentUserId;
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private buildSavePayload(location: TjsLocation, isActive: boolean): SaveTjsLocationInput {
    return {
      name: location.name,
      address: location.address,
      lat: location.lat,
      long: location.long,
      description: location.description,
      is_public: location.is_public,
      is_private: location.is_private,
      public_description: location.public_description,
      restricted_description: location.restricted_description,
      capacity: location.capacity,
      city: location.city,
      country: location.country,
      zip: location.zip,
      phone: location.phone,
      email: location.email,
      website: location.website,
      is_active: isActive,
      access_info: location.access_info,
      created_by: location.created_by ?? this.currentUserId,
      updated_by: this.currentUserId,
      image_urls: location.images.map((image) => image.image_url),
      amenity_ids: location.amenities.map((item) => item.id),
      spec_ids: location.specs.map((item) => item.id),
      location_type_id: location.location_type?.id ?? null,
    };
  }
}
