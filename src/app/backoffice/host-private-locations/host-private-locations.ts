import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkspaceEditButton } from '../../shared/workspace-edit/workspace-edit-button';
import { AuthService } from '../../services/auth.service';
import {
  LocationImageInput,
  LocationLookupOption,
  SaveTjsPrivateLocationInput,
  SupabaseService,
  TjsHost,
  TjsPrivateLocation,
} from '../../services/supabase.service';
import { validateLocationForActivation } from '../../shared/location-profile/location-public-profile.util';
import { ImageCopyrightTag } from '../../shared/image-copyright/image-copyright-tag';
import { normalizeCopyrightInput } from '../../shared/image-copyright/image-copyright.util';

interface LocationForm {
  name: string;
  address: string;
  lat: string;
  long: string;
  description: string;
  public_description: string;
  restricted_description: string;
  capacity: string;
  city: string;
  country: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  access_info: string;
  is_active: boolean;
  is_address_visible: boolean;
  images: LocationImageInput[];
  location_type_id: number | null;
  amenities: LocationLookupOption[];
  specs: LocationLookupOption[];
}

@Component({
  selector: 'app-host-private-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WorkspaceEditButton, ImageCopyrightTag],
  templateUrl: './host-private-locations.html',
})
export class HostPrivateLocations implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  currentHostId: number | null = null;
  isLoading = true;
  isSaving = false;
  isUploadingImages = false;
  isEditing = false;
  error = '';
  successMessage = '';
  searchQuery = '';
  selectedAmenityId = '';
  selectedSpecId = '';
  defaultImageCopyright = '';

  locations: TjsPrivateLocation[] = [];
  accessibleHosts: TjsHost[] = [];
  amenityOptions: LocationLookupOption[] = [];
  specOptions: LocationLookupOption[] = [];
  typeOptions: LocationLookupOption[] = [];
  editingLocation: TjsPrivateLocation | null = null;
  form: LocationForm = this.blankForm();

  get currentUserId(): string {
    return this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
  }

  get detailRoutePrefix(): string {
    if (this.authService.isAdmin) {
      return '/backoffice/locations/private';
    }

    return this.authService.isHostManager
      ? '/backoffice/host-manager/locations/private'
      : '/backoffice/host/locations/my';
  }

  get pageTitle(): string {
    if (this.authService.isAdmin) {
      return 'Private Locations';
    }

    return this.authService.isHostManager ? 'Private Locations' : 'My Locations';
  }

  get pageDescription(): string {
    if (this.authService.isAdmin) {
      return 'Manage all private locations, assign them to hosts, and update their venue details from the admin workspace.';
    }

    return this.authService.isHostManager
      ? 'Manage private locations across your assigned hosts from this workspace.'
      : 'Manage your private host locations from this workspace.';
  }

  get canSelectHost(): boolean {
    return this.authService.isAdmin || this.authService.isHostManager;
  }

  get isHostManagerWorkspace(): boolean {
    return this.authService.isHostManager;
  }

  get isAdminWorkspace(): boolean {
    return this.authService.isAdmin;
  }

  get filteredLocations(): TjsPrivateLocation[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.locations;
    }

    return this.locations.filter((location) =>
      [location.name, location.city, location.country, location.address, location.location_type?.name]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(query))
    );
  }

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    try {
      const [hosts, locations, amenityOptions, specOptions, typeOptions] = await Promise.all([
        this.isAdminWorkspace ? this.supabase.getHosts() : this.supabase.getAccessibleHosts(this.currentUserId),
        this.isAdminWorkspace ? this.supabase.getAllPrivateLocations() : this.supabase.getPrivateLocations(this.currentUserId),
        this.supabase.listLocationAmenities(),
        this.supabase.listLocationSpecs(),
        this.supabase.listLocationTypes(),
      ]);

      this.accessibleHosts = hosts;
      this.currentHostId = hosts[0]?.id ?? null;
      this.locations = locations;
      this.amenityOptions = amenityOptions;
      this.specOptions = specOptions;
      this.typeOptions = typeOptions;
    } finally {
      this.isLoading = false;
    }
  }

  openCreateForm() {
    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
    this.editingLocation = null;
    this.selectedAmenityId = '';
    this.selectedSpecId = '';
    this.defaultImageCopyright = '';
    this.form = this.blankForm();
  }

  openEditForm(location: TjsPrivateLocation) {
    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
    this.editingLocation = location;
    this.selectedAmenityId = '';
    this.selectedSpecId = '';
    this.defaultImageCopyright = location.images[0]?.copyright_text ?? '';
    this.form = {
      name: location.name,
      address: location.address ?? '',
      lat: location.lat?.toString() ?? '',
      long: location.long?.toString() ?? '',
      description: location.description ?? '',
      public_description: location.public_description ?? '',
      restricted_description: location.restricted_description ?? '',
      capacity: location.capacity ?? '',
      city: location.city ?? '',
      country: location.country ?? '',
      zip: location.zip ?? '',
      phone: location.phone ?? '',
      email: location.email ?? '',
      website: location.website ?? '',
      access_info: location.access_info ?? '',
      is_active: location.is_active,
      is_address_visible: location.is_address_visible === true,
      images: location.images.map((image) => ({
        image_url: image.image_url,
        copyright_text: image.copyright_text ?? '',
      })),
      location_type_id: location.location_type?.id ?? null,
      amenities: [...location.amenities],
      specs: [...location.specs],
    };
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingLocation = null;
    this.defaultImageCopyright = '';
    this.form = this.blankForm();
    this.error = '';
  }

  async saveLocation() {
    if (!this.form.name.trim()) {
      this.error = 'Location name is required.';
      return;
    }

    if (this.form.is_active) {
      const activationError = validateLocationForActivation({
        address: this.form.address,
        lat: this.parseOptionalNumber(this.form.lat),
        long: this.parseOptionalNumber(this.form.long),
      });
      if (activationError) {
        this.error = activationError;
        return;
      }
    }

    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    if (!this.editingLocation && !this.currentHostId) {
      this.error = 'No host is assigned to your account.';
      this.isSaving = false;
      return;
    }

    const payload: SaveTjsPrivateLocationInput = {
      id_host: this.currentHostId ?? this.editingLocation?.id_host ?? null,
      name: this.form.name,
      address: this.form.address,
      lat: this.parseOptionalNumber(this.form.lat),
      long: this.parseOptionalNumber(this.form.long),
      description: this.form.description,
      public_description: this.form.public_description,
      restricted_description: this.form.restricted_description,
      capacity: this.form.capacity,
      city: this.form.city,
      country: this.form.country,
      zip: this.form.zip,
      phone: this.form.phone,
      email: this.form.email,
      website: this.form.website,
      is_active: this.form.is_active,
      is_address_visible: this.form.is_address_visible,
      access_info: this.form.access_info,
      created_by: this.editingLocation?.created_by ?? this.currentUserId,
      updated_by: this.currentUserId,
      images: this.form.images.slice(0, 5),
      amenity_ids: this.form.amenities.map((item) => item.id),
      spec_ids: this.form.specs.map((item) => item.id),
      location_type_id: this.parseOptionalId(this.form.location_type_id),
    };

    const error = this.editingLocation
      ? await this.supabase.updatePrivateLocation(this.editingLocation.id, payload)
      : (await this.supabase.createPrivateLocation(payload)).error;

    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.successMessage = this.editingLocation ? 'Private location updated successfully.' : 'Private location created successfully.';
    this.isSaving = false;
    this.cancelEdit();
    await this.loadData();
  }

  async deleteLocation(location: TjsPrivateLocation) {
    if (!window.confirm(`Delete "${location.name}"?`)) {
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.isSaving = true;

    const error = await this.supabase.deletePrivateLocation(location.id);
    if (error) {
      this.error = error;
    } else {
      if (this.editingLocation?.id === location.id) {
        this.cancelEdit();
      }
      this.successMessage = 'Private location deleted successfully.';
      await this.loadData();
    }

    this.isSaving = false;
  }

  async toggleLocationStatus(location: TjsPrivateLocation) {
    this.error = '';
    this.successMessage = '';

    const nextStatus = !location.is_active;
    if (nextStatus) {
      const activationError = validateLocationForActivation(location);
      if (activationError) {
        this.error = activationError;
        return;
      }
    }

    this.isSaving = true;

    const payload: SaveTjsPrivateLocationInput = {
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
      is_active: nextStatus,
      is_address_visible: location.is_address_visible === true,
      access_info: location.access_info,
      created_by: location.created_by ?? this.currentUserId,
      updated_by: this.currentUserId,
      images: location.images.map((image) => ({
        image_url: image.image_url,
        copyright_text: image.copyright_text ?? '',
      })),
      amenity_ids: location.amenities.map((item) => item.id),
      spec_ids: location.specs.map((item) => item.id),
      location_type_id: location.location_type?.id ?? null,
    };

    const error = await this.supabase.updatePrivateLocation(location.id, payload);

    if (error) {
      this.error = error;
    } else {
      this.successMessage = `Location marked as ${location.is_active ? 'inactive' : 'active'}.`;
      await this.loadData();
    }

    this.isSaving = false;
  }

  async onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (files.length === 0) {
      return;
    }

    if (this.form.images.length >= 5) {
      this.error = 'You can upload up to 5 images.';
      return;
    }

    const remainingSlots = 5 - this.form.images.length;
    const uploadQueue = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      this.error = 'Only the first 5 images are kept for a location.';
    } else {
      this.error = '';
    }

    this.isUploadingImages = true;

    for (const file of uploadQueue) {
      const { url, error } = await this.supabase.uploadPrivateLocationImage(this.currentUserId, file);
      if (error) {
        this.error = error;
        break;
      }
      if (url) {
        this.form.images = [
          ...this.form.images,
          { image_url: url, copyright_text: normalizeCopyrightInput(this.defaultImageCopyright) },
        ].slice(0, 5);
      }
    }

    this.isUploadingImages = false;
  }

  removeImage(index: number) {
    this.form.images = this.form.images.filter((_, imageIndex) => imageIndex !== index);
  }

  addAmenity() {
    const amenityId = Number(this.selectedAmenityId);
    if (!amenityId) {
      return;
    }

    const selected = this.amenityOptions.find((option) => option.id === amenityId);
    if (selected && !this.form.amenities.some((item) => item.id === selected.id)) {
      this.form.amenities = [...this.form.amenities, selected];
    }

    this.selectedAmenityId = '';
  }

  removeAmenity(amenityId: number) {
    this.form.amenities = this.form.amenities.filter((item) => item.id !== amenityId);
  }

  addSpec() {
    const specId = Number(this.selectedSpecId);
    if (!specId) {
      return;
    }

    const selected = this.specOptions.find((option) => option.id === specId);
    if (selected && !this.form.specs.some((item) => item.id === selected.id)) {
      this.form.specs = [...this.form.specs, selected];
    }

    this.selectedSpecId = '';
  }

  removeSpec(specId: number) {
    this.form.specs = this.form.specs.filter((item) => item.id !== specId);
  }

  trackByLocation(_: number, location: TjsPrivateLocation) {
    return location.id;
  }

  trackByHost(_: number, host: TjsHost) {
    return host.id;
  }

  trackByOption(_: number, option: LocationLookupOption) {
    return option.id;
  }

  trackByImage(index: number, image: LocationImageInput) {
    return `${index}:${image.image_url}`;
  }

  hostNameForLocation(location: TjsPrivateLocation): string {
    return this.accessibleHosts.find((host) => host.id === location.id_host)?.name || `Host #${location.id_host}`;
  }

  onHostSelected(hostId: number | null) {
    this.currentHostId = typeof hostId === 'number' ? hostId : null;
  }

  private blankForm(): LocationForm {
    return {
      name: '',
      address: '',
      lat: '',
      long: '',
      description: '',
      public_description: '',
      restricted_description: '',
      capacity: '',
      city: '',
      country: '',
      zip: '',
      phone: '',
      email: '',
      website: '',
      access_info: '',
      is_active: false,
      is_address_visible: false,
      images: [],
      location_type_id: null,
      amenities: [],
      specs: [],
    };
  }

  private parseOptionalNumber(value: string): number | null {
    if (!value.trim()) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseOptionalId(value: number | string | null): number | null {
    if (value === null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
