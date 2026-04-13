import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SaveTjsLocationInput, SupabaseService, TjsLocation } from '../../services/supabase.service';

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
  location: TjsLocation | null = null;
  zoomedImageUrl: string | null = null;

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const locationId = this.route.snapshot.paramMap.get('id');
    if (!locationId) {
      this.error = 'Private location not found.';
      this.isLoading = false;
      return;
    }

    const location = await this.supabase.getPrivateLocationById(locationId, this.currentUserId);
    if (!location) {
      this.error = 'Private location not found.';
      this.isLoading = false;
      return;
    }

    this.location = location;
    this.isLoading = false;
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get backRoute(): string {
    return '/backoffice/host/locations/my';
  }

  async toggleLocationStatus() {
    if (!this.location || this.isUpdatingStatus) {
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

  private buildSavePayload(location: TjsLocation, isActive: boolean): SaveTjsLocationInput {
    return {
      name: location.name,
      address: location.address,
      lat: location.lat,
      long: location.long,
      description: location.description,
      is_public: false,
      is_private: true,
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
