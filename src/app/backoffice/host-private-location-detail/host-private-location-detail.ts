import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HostPrivateLocationBookingItem, SaveTjsPrivateLocationInput, SupabaseService, TjsPrivateLocation } from '../../services/supabase.service';

interface PrivateLocationCalendarDay {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  bookings: HostPrivateLocationBookingItem[];
}

@Component({
  selector: 'app-host-private-location-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './host-private-location-detail.html',
})
export class HostPrivateLocationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isUpdatingStatus = false;
  error = '';
  successMessage = '';
  location: TjsPrivateLocation | null = null;
  zoomedImageUrl: string | null = null;
  bookings: HostPrivateLocationBookingItem[] = [];
  calendarMonth = this.startOfMonth(new Date());

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const locationId = this.route.snapshot.paramMap.get('id');
    if (!locationId) {
      this.error = 'Private location not found.';
      this.isLoading = false;
      return;
    }

    const [location, bookings] = await Promise.all([
      this.supabase.getPrivateLocationById(locationId, this.authService.isAdmin ? undefined : this.currentUserId),
      this.supabase.getHostPrivateLocationBookings(this.authService.isAdmin ? undefined : this.currentUserId, locationId),
    ]);

    if (!location) {
      this.error = 'Private location not found.';
      this.isLoading = false;
      return;
    }

    this.location = location;
    this.bookings = bookings;
    this.isLoading = false;
  }

  get currentUserId(): string {
    return this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
  }

  get backRoute(): string {
    if (this.authService.isAdmin) {
      return '/backoffice/locations/private';
    }

    return this.authService.isHostManager
      ? '/backoffice/host-manager/locations/private'
      : '/backoffice/host/locations/my';
  }

  async toggleLocationStatus() {
    if (!this.location || this.isUpdatingStatus) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isUpdatingStatus = true;

    const nextStatus = !this.location.is_active;
    const error = await this.supabase.updatePrivateLocation(this.location.id, this.buildSavePayload(this.location, nextStatus));

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

  get calendarDays(): PrivateLocationCalendarDay[] {
    const firstDay = this.startOfMonth(this.calendarMonth);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    const days: PrivateLocationCalendarDay[] = [];
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

  trackByCalendarDate(_: number, day: PrivateLocationCalendarDay) {
    return day.date;
  }

  trackByBooking(_: number, booking: HostPrivateLocationBookingItem) {
    return booking.event_id;
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

  scheduleLabel(booking: HostPrivateLocationBookingItem): string {
    if (booking.schedule_entries.length === 0) {
      return 'No schedule saved';
    }

    return booking.schedule_entries
      .map((entry) => entry.mode === 'period'
        ? `${entry.start_date} to ${entry.end_date || 'TBD'}`
        : entry.start_date)
      .join(', ');
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private buildSavePayload(location: TjsPrivateLocation, isActive: boolean): SaveTjsPrivateLocationInput {
    return {
      id_host: location.id_host,
      name: location.name,
      address: location.address,
      lat: location.lat,
      long: location.long,
      description: location.description,
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
