import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { HostManagerService } from '../../services/host-manager.service';
import {
  LocationLookupOption,
  SaveTjsPrivateLocationInput,
  SupabaseService,
  TjsHost,
  TjsHostMember,
  TjsPrivateLocation,
  TjsUserWithRoles,
} from '../../services/supabase.service';

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
  image_urls: string[];
  location_type_id: number | null;
  amenities: LocationLookupOption[];
  specs: LocationLookupOption[];
}

interface InviteHostUserForm {
  email: string;
  fullName: string;
  phone: string;
}

@Component({
  selector: 'app-host-manager-host-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './host-manager-host-detail.html',
  styleUrl: './host-manager-host-detail.scss'
})
export class HostManagerHostDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private hostManagerService = inject(HostManagerService);
  private supabase = inject(SupabaseService);

  activeTab: 'details' | 'location' | 'user' = 'details';
  hostId: number | null = null;

  isLoading = true;
  isSavingLocation = false;
  isUploadingImages = false;
  isSavingUser = false;
  isResendingEmail = false;
  isLocationFormOpen = false;
  isEditingSelectedLocation = false;
  isDrawerOpen = false;
  showInviteHostUserModal = false;
  showExistingAssignmentConfirmModal = false;
  showRemoveHostUserModal = false;
  error = '';
  locationError = '';
  locationSuccessMessage = '';
  userError = '';
  userSuccessMessage = '';

  host: TjsHost | null = null;
  hostMembers: TjsHostMember[] = [];
  allHostMembers: TjsHostMember[] = []; // All members across all hosts
  hostEvents: Array<{ id: string; title: string; status: string; event_dates: string[] | null; location_name: string | null }> = [];
  hostArtists: Array<{ artist_id: string; artist_name: string; event_count: number }> = [];
  privateLocations: TjsPrivateLocation[] = [];
  selectedPrivateLocation: TjsPrivateLocation | null = null;
  hostUsers: TjsUserWithRoles[] = [];
  selectedHostUserId = '';
  hostRoleId = '';
  pendingUserAssignment: TjsUserWithRoles | null = null;
  pendingUserOtherHosts: Array<{ id: number; name: string | null; public_name: string | null }> = [];
  pendingRemoveMember: TjsHostMember | null = null;

  amenityOptions: LocationLookupOption[] = [];
  specOptions: LocationLookupOption[] = [];
  typeOptions: LocationLookupOption[] = [];
  selectedAmenityId = '';
  selectedSpecId = '';
  form: LocationForm = this.blankForm();
  inviteHostUserForm: InviteHostUserForm = this.blankInviteHostUserForm();

  get locationPanelMode(): 'create' | 'edit' | 'view' | 'empty' {
    if (this.isLocationFormOpen) {
      return this.isEditingSelectedLocation ? 'edit' : 'create';
    }

    if (this.selectedPrivateLocation) {
      return 'view';
    }

    return 'empty';
  }

  get currentUserId(): string {
    return this.authService.currentProfile?.id ?? this.authService.currentUser?.id ?? '';
  }

  get availableHostUsers(): TjsUserWithRoles[] {
    // Filter out users who are assigned to ANY host (not just current host)
    const assignedToAnyHostIds = new Set(this.allHostMembers.map((member) => member.profile_id));
    return this.hostUsers.filter((user) => !assignedToAnyHostIds.has(user.id));
  }

  get selectedHostUser(): TjsUserWithRoles | null {
    return this.availableHostUsers.find((user) => user.id === this.selectedHostUserId) ?? null;
  }

  async ngOnInit() {
    const hostIdParam = this.route.snapshot.paramMap.get('id');
    const parsedHostId = Number(hostIdParam);

    if (!hostIdParam || !Number.isFinite(parsedHostId)) {
      this.error = 'Host not found.';
      this.isLoading = false;
      return;
    }

    this.hostId = parsedHostId;
    await this.authService.waitForAuthReady();

    try {
      const [details, privateLocations, amenityOptions, specOptions, typeOptions, users, roles, allMembers] = await Promise.all([
        lastValueFrom(this.hostManagerService.getHostDetails(hostIdParam)),
        this.supabase.getPrivateLocationsForHost(parsedHostId),
        this.supabase.listLocationAmenities(),
        this.supabase.listLocationSpecs(),
        this.supabase.listLocationTypes(),
        this.supabase.listAllUsersWithRoles(),
        this.supabase.getAllRoles(),
        this.supabase.getAllHostMembers(), // Fetch all host members
      ]);

      this.host = details.host;
      this.hostMembers = details.members;
      this.allHostMembers = allMembers; // Store all host members
      this.hostEvents = details.events;
      this.hostArtists = details.artists;
      this.privateLocations = privateLocations;
      this.amenityOptions = amenityOptions;
      this.specOptions = specOptions;
      this.typeOptions = typeOptions;
      this.hostUsers = users.filter((user) => this.hasHostRole(user));
      this.hostRoleId = roles.find((role) => role.name === 'Host')?.id ?? '';

      if (!details.host) {
        this.error = 'Host not found.';
      }
    } catch (err) {
      console.error('Error loading host details:', err);
      this.error = 'Failed to load host details';
    } finally {
      this.isLoading = false;
    }
  }

  selectTab(tab: 'details' | 'location' | 'user') {
    this.activeTab = tab;
    this.locationError = '';
    this.locationSuccessMessage = '';
    this.userError = '';
    this.userSuccessMessage = '';
  }

  selectPrivateLocation(location: TjsPrivateLocation) {
    this.selectedPrivateLocation = location;
    this.isEditingSelectedLocation = false;
    this.isLocationFormOpen = false;
    this.isDrawerOpen = true;
    this.selectedAmenityId = '';
    this.selectedSpecId = '';
    this.locationError = '';
    this.locationSuccessMessage = '';
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.isLocationFormOpen = false;
    this.isEditingSelectedLocation = false;
    this.locationError = '';
    this.locationSuccessMessage = '';
    this.selectedAmenityId = '';
    this.selectedSpecId = '';
  }

  openCreateLocationForm() {
    this.isLocationFormOpen = true;
    this.isEditingSelectedLocation = false;
    this.selectedPrivateLocation = null;
    this.locationError = '';
    this.locationSuccessMessage = '';
    this.selectedAmenityId = '';
    this.selectedSpecId = '';
    this.form = this.blankForm();
  }

  cancelLocationForm() {
    this.isLocationFormOpen = false;
    this.isEditingSelectedLocation = false;
    this.locationError = '';
    this.selectedAmenityId = '';
    this.selectedSpecId = '';
    this.form = this.blankForm();
  }

  openEditSelectedLocationForm() {
    if (!this.selectedPrivateLocation) {
      return;
    }

    this.isLocationFormOpen = true;
    this.isEditingSelectedLocation = true;
    this.isDrawerOpen = true;
    this.locationError = '';
    this.locationSuccessMessage = '';
    this.selectedAmenityId = '';
    this.selectedSpecId = '';
    this.form = {
      name: this.selectedPrivateLocation.name,
      address: this.selectedPrivateLocation.address ?? '',
      lat: this.selectedPrivateLocation.lat?.toString() ?? '',
      long: this.selectedPrivateLocation.long?.toString() ?? '',
      description: this.selectedPrivateLocation.description ?? '',
      public_description: this.selectedPrivateLocation.public_description ?? '',
      restricted_description: this.selectedPrivateLocation.restricted_description ?? '',
      capacity: this.selectedPrivateLocation.capacity ?? '',
      city: this.selectedPrivateLocation.city ?? '',
      country: this.selectedPrivateLocation.country ?? '',
      zip: this.selectedPrivateLocation.zip ?? '',
      phone: this.selectedPrivateLocation.phone ?? '',
      email: this.selectedPrivateLocation.email ?? '',
      website: this.selectedPrivateLocation.website ?? '',
      access_info: this.selectedPrivateLocation.access_info ?? '',
      is_active: this.selectedPrivateLocation.is_active,
      image_urls: [...this.selectedPrivateLocation.images.map((image) => image.image_url)],
      location_type_id: this.selectedPrivateLocation.location_type?.id ?? null,
      amenities: [...this.selectedPrivateLocation.amenities],
      specs: [...this.selectedPrivateLocation.specs],
    };
  }

  async saveLocation() {
    if (!this.hostId) {
      this.locationError = 'Host not found.';
      return;
    }

    if (!this.form.name.trim()) {
      this.locationError = 'Location name is required.';
      return;
    }

    this.isSavingLocation = true;
    this.locationError = '';
    this.locationSuccessMessage = '';

    const payload: Omit<SaveTjsPrivateLocationInput, 'id_host'> = {
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
      access_info: this.form.access_info,
      created_by: this.currentUserId,
      updated_by: this.currentUserId,
      image_urls: this.form.image_urls.slice(0, 5),
      amenity_ids: this.form.amenities.map((item) => item.id),
      spec_ids: this.form.specs.map((item) => item.id),
      location_type_id: this.parseOptionalId(this.form.location_type_id),
    };

    const result = this.isEditingSelectedLocation && this.selectedPrivateLocation
      ? {
          id: this.selectedPrivateLocation.id,
          error: await this.supabase.updatePrivateLocation(this.selectedPrivateLocation.id, {
            id_host: this.selectedPrivateLocation.id_host,
            ...payload,
          }),
        }
      : await this.supabase.createPrivateLocationForHost(this.hostId, payload);

    const { id, error } = result;

    if (error) {
      this.locationError = error;
      this.isSavingLocation = false;
      return;
    }

    this.locationSuccessMessage = this.isEditingSelectedLocation
      ? 'Private location updated successfully.'
      : 'Private location created successfully.';
    this.privateLocations = await this.supabase.getPrivateLocationsForHost(this.hostId);
    this.selectedPrivateLocation = this.privateLocations.find((location) => location.id === id) ?? this.selectedPrivateLocation;
    this.isSavingLocation = false;
    this.cancelLocationForm();
    if (this.selectedPrivateLocation) {
      this.isDrawerOpen = true;
    }
  }

  async onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (files.length === 0) {
      return;
    }

    if (this.form.image_urls.length >= 5) {
      this.locationError = 'You can upload up to 5 images.';
      return;
    }

    const remainingSlots = 5 - this.form.image_urls.length;
    const uploadQueue = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      this.locationError = 'Only the first 5 images are kept for a location.';
    } else {
      this.locationError = '';
    }

    this.isUploadingImages = true;

    for (const file of uploadQueue) {
      const { url, error } = await this.supabase.uploadPrivateLocationImage(this.currentUserId, file);
      if (error) {
        this.locationError = error;
        break;
      }

      if (url) {
        this.form.image_urls = [...this.form.image_urls, url].slice(0, 5);
      }
    }

    this.isUploadingImages = false;
  }

  removeImage(index: number) {
    this.form.image_urls = this.form.image_urls.filter((_, imageIndex) => imageIndex !== index);
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

  async assignSelectedHostUser() {
    if (!this.hostId) {
      this.userError = 'Host not found.';
      return;
    }

    const user = this.selectedHostUser;
    if (!user) {
      this.userError = 'Select a host user to assign.';
      return;
    }

    this.isSavingUser = true;
    this.userError = '';
    this.userSuccessMessage = '';

    const existingHosts = await this.supabase.getHostsForMember(user.id);
    const otherHosts = existingHosts.filter((host) => host.id !== this.hostId);

    if (otherHosts.length > 0) {
      this.pendingUserAssignment = user;
      this.pendingUserOtherHosts = otherHosts;
      this.showExistingAssignmentConfirmModal = true;
      this.isSavingUser = false;
      return;
    }

    await this.completeHostUserAssignment(user);
  }

  async confirmExistingAssignment() {
    if (!this.pendingUserAssignment) {
      return;
    }

    this.isSavingUser = true;
    this.userError = '';
    await this.completeHostUserAssignment(this.pendingUserAssignment);
    this.showExistingAssignmentConfirmModal = false;
    this.pendingUserAssignment = null;
    this.pendingUserOtherHosts = [];
  }

  cancelExistingAssignmentConfirmation() {
    this.showExistingAssignmentConfirmModal = false;
    this.pendingUserAssignment = null;
    this.pendingUserOtherHosts = [];
    this.userError = '';
  }

  openInviteHostUserModal() {
    this.userError = '';
    this.userSuccessMessage = '';
    this.inviteHostUserForm = this.blankInviteHostUserForm();
    this.showInviteHostUserModal = true;
  }

  closeInviteHostUserModal() {
    this.showInviteHostUserModal = false;
    this.inviteHostUserForm = this.blankInviteHostUserForm();
  }

  async submitInviteHostUser() {
    if (!this.hostId) {
      this.userError = 'Host not found.';
      return;
    }

    const normalizedEmail = this.inviteHostUserForm.email.trim().toLowerCase();
    const fullName = this.inviteHostUserForm.fullName.trim();

    if (!normalizedEmail || !fullName) {
      this.userError = 'Email and full name are required.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      this.userError = 'Please enter a valid email address.';
      return;
    }

    if (!this.hostRoleId) {
      this.userError = 'Host role not found.';
      return;
    }

    this.isSavingUser = true;
    this.userError = '';
    this.userSuccessMessage = '';

    const redirectTo = this.supabase.getInviteRedirectUrl();
    const { userId, error: inviteError } = await this.supabase.inviteUser(
      normalizedEmail,
      fullName,
      redirectTo
    );

    if (inviteError || !userId) {
      this.userError = inviteError ?? 'Unable to invite host user.';
      this.isSavingUser = false;
      return;
    }

    const profileError = await this.supabase.upsertProfile({
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      phone: this.inviteHostUserForm.phone.trim() || null,
    });

    if (profileError) {
      this.userError = profileError;
      this.isSavingUser = false;
      return;
    }

    const roleError = await this.supabase.assignRole(userId, this.hostRoleId, this.currentUserId);
    if (roleError) {
      this.userError = roleError;
      this.isSavingUser = false;
      return;
    }

    const assignError = await this.supabase.assignHostMember(this.hostId, userId);
    if (assignError) {
      this.userError = assignError;
      this.isSavingUser = false;
      return;
    }

    this.hostUsers = await this.refreshHostUsers();
    this.hostMembers = await this.supabase.getHostMembers(this.hostId);
    this.userSuccessMessage = `Host user invited and assigned to ${this.host?.name || 'this host'}.`;
    this.closeInviteHostUserModal();
    this.isSavingUser = false;
  }

  trackByMember(_: number, member: TjsHostMember) {
    return member.id;
  }

  trackByEvent(_: number, event: { id: string }) {
    return event.id;
  }

  trackByArtist(_: number, artist: { artist_id: string }) {
    return artist.artist_id;
  }

  trackByLocation(_: number, location: TjsPrivateLocation) {
    return location.id;
  }

  trackByOption(_: number, option: LocationLookupOption) {
    return option.id;
  }

  trackByImage(index: number, imageUrl: string) {
    return `${index}:${imageUrl}`;
  }

  trackByUser(_: number, user: TjsUserWithRoles) {
    return user.id;
  }

  getUserDisplayName(user: TjsUserWithRoles): string {
    const profile = user as any;
    return profile.full_name || profile.email || 'Unknown';
  }

  getUserEmail(user: TjsUserWithRoles): string {
    const profile = user as any;
    return profile.email || '';
  }

  getUserFullName(user: TjsUserWithRoles): string | null {
    const profile = user as any;
    return profile.full_name || null;
  }

  openRemoveHostUserModal(member: TjsHostMember) {
    this.pendingRemoveMember = member;
    this.showRemoveHostUserModal = true;
    this.userError = '';
  }

  closeRemoveHostUserModal() {
    this.showRemoveHostUserModal = false;
    this.pendingRemoveMember = null;
    this.userError = '';
  }

  async confirmRemoveHostUser() {
    if (!this.pendingRemoveMember) {
      return;
    }

    this.isSavingUser = true;
    this.userError = '';
    this.userSuccessMessage = '';

    const error = await this.supabase.removeHostMember(this.pendingRemoveMember.id);
    if (error) {
      this.userError = error;
      this.isSavingUser = false;
      return;
    }

    if (this.hostId) {
      this.hostMembers = await this.supabase.getHostMembers(this.hostId);
      this.allHostMembers = await this.supabase.getAllHostMembers();
    }

    this.userSuccessMessage = `Host user removed from ${this.host?.name || 'this host'}.`;
    this.showRemoveHostUserModal = false;
    this.pendingRemoveMember = null;
    this.isSavingUser = false;
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
      is_active: true,
      image_urls: [],
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

  private async completeHostUserAssignment(user: TjsUserWithRoles) {
    if (!this.hostId) {
      this.userError = 'Host not found.';
      this.isSavingUser = false;
      return;
    }

    const error = await this.supabase.assignHostMember(this.hostId, user.id);
    if (error) {
      this.userError = error;
      this.isSavingUser = false;
      return;
    }

    this.hostMembers = await this.supabase.getHostMembers(this.hostId);
    this.selectedHostUserId = '';
    this.pendingUserAssignment = null;
    this.pendingUserOtherHosts = [];
    this.userSuccessMessage = `Host user assigned to ${this.host?.name || 'this host'}.`;
    this.isSavingUser = false;
  }

  private async refreshHostUsers(): Promise<TjsUserWithRoles[]> {
    const users = await this.supabase.listAllUsersWithRoles();
    return users.filter((user) => this.hasHostRole(user));
  }

  private hasHostRole(user: TjsUserWithRoles): boolean {
    return user.roles.some((role) => role.name === 'Host' || role.name === 'Host+');
  }

  private blankInviteHostUserForm(): InviteHostUserForm {
    return {
      email: '',
      fullName: '',
      phone: '',
    };
  }

  getMemberAccountStatus(member: TjsHostMember): 'active' | 'pending' | 'inactive' {
    const user = this.hostUsers.find(u => u.id === member.profile_id);
    return user?.account_status ?? 'inactive';
  }

  async resendActivationEmail(member: TjsHostMember) {
    if (!member.profile?.email || !member.profile?.full_name) {
      this.userError = 'User email or name not found.';
      return;
    }

    this.isResendingEmail = true;
    this.userError = '';
    this.userSuccessMessage = '';

    const redirectTo = this.supabase.getInviteRedirectUrl();
    const error = await this.supabase.resendInvite(
      member.profile.email,
      member.profile.full_name,
      redirectTo
    );

    if (error) {
      this.userError = error;
      this.isResendingEmail = false;
      return;
    }

    this.userSuccessMessage = `Activation email resent to ${member.profile.email}.`;
    this.isResendingEmail = false;
  }
}
