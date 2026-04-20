import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { HostManagerService } from '../../services/host-manager.service';
import { AuthService } from '../../services/auth.service';
import {
  SupabaseService,
  SysHostType,
  TjsHost,
  TjsHostMember,
  TjsProfile,
  TjsRole,
  TjsUserWithRoles,
} from '../../services/supabase.service';

interface HostForm {
  name: string;
  public_name: string;
  address: string;
  city: string;
  proviance: string;
  zip: string;
  country: string;
  host_per_year: string;
  capacity: number | null;
  id_host_type: number | null;
  contact_fname: string;
  contact_lname: string;
  contact_phone1: string;
  contact_phone2: string;
  contact_email: string;
  comment: string;
  web_url: string;
  is_host_plus: boolean;
}

interface InviteHostUserForm {
  email: string;
  fullName: string;
  phone: string;
}

@Component({
  selector: 'app-host-manager-hosts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './host-manager-hosts.html',
  styleUrl: './host-manager-hosts.scss'
})
export class HostManagerHosts implements OnInit {
  private hostManagerService = inject(HostManagerService);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLoading = true;
  isSaving = false;
  isLoadingMembers = false;
  error = '';
  successMessage = '';
  searchQuery = '';
  memberSearchQuery = '';

  hosts: TjsHost[] = [];
  hostTypes: SysHostType[] = [];
  hostUsers: TjsUserWithRoles[] = [];
  hostMembers: TjsHostMember[] = [];
  assignedHostUserIds: string[] = [];
  selectedHost: TjsHost | null = null;

  showCreateModal = false;
  showEditModal = false;
  showMembersModal = false;
  showInviteHostUserModal = false;

  hostForm: HostForm = this.blankForm();
  inviteHostUserForm: InviteHostUserForm = this.blankInviteHostUserForm();
  hostRoleId = '';
  hostPlusRoleId = '';

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  get filteredHosts(): TjsHost[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.hosts;
    }

    return this.hosts.filter((host) =>
      [
        host.name,
        host.public_name,
        host.address,
        host.city,
        host.country,
        host.contact_email,
        host.contact_phone1,
      ]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(query))
    );
  }

  get availableHostUsers(): TjsUserWithRoles[] {
    const assignedIds = new Set(this.assignedHostUserIds);
    const query = this.memberSearchQuery.trim().toLowerCase();

    return this.hostUsers.filter((user) => {
      if (assignedIds.has(user.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [user.full_name, user.email]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(query));
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';

    const userId = this.currentUserId;
    if (!userId) {
      this.isLoading = false;
      return;
    }

    try {
      const [hosts, hostTypes, users, roles, allHostMembers] = await Promise.all([
        lastValueFrom(this.hostManagerService.getAssignedHosts(userId)),
        this.supabase.getHostTypes(),
        this.supabase.listAllUsersWithRoles(),
        this.supabase.getAllRoles(),
        this.supabase.getAllHostMembers(),
      ]);

      this.hosts = hosts;
      this.hostTypes = hostTypes;
      this.hostRoleId = roles.find((role) => role.name === 'Host')?.id ?? '';
      this.hostPlusRoleId = roles.find((role) => role.name === 'Host+')?.id ?? '';
      this.hostUsers = users.filter((user) => this.hasHostRole(user));
      this.assignedHostUserIds = Array.from(new Set(allHostMembers.map((member) => member.profile_id).filter(Boolean)));
    } catch (err) {
      console.error('Error loading hosts:', err);
      this.error = 'Failed to load hosts';
    } finally {
      this.isLoading = false;
    }
  }

  avatarLetter(name: string | null): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  countByType(typeId: number): number {
    return this.hosts.filter((host) => host.id_host_type === typeId).length;
  }

  hostTypeName(id: number | null): string {
    if (!id) {
      return '-';
    }

    return this.hostTypes.find((type) => type.id === id)?.name ?? '-';
  }

  async openHost(host: TjsHost) {
    await this.router.navigate(['/backoffice/host-manager/hosts', host.id]);
  }

  openCreateModal() {
    this.error = '';
    this.successMessage = '';
    this.hostForm = this.blankForm();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  async submitCreate() {
    if (!this.hostForm.name.trim()) {
      this.error = 'Host name is required.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    const { error } = await this.supabase.createHost({
      name: this.hostForm.name,
      public_name: this.hostForm.public_name || null,
      address: this.hostForm.address || null,
      city: this.hostForm.city || null,
      proviance: this.hostForm.proviance || null,
      zip: this.hostForm.zip || null,
      country: this.hostForm.country || null,
      host_per_year: this.hostForm.host_per_year || null,
      capacity: this.hostForm.capacity,
      id_host_type: this.hostForm.id_host_type,
      contact_fname: this.hostForm.contact_fname || null,
      contact_lname: this.hostForm.contact_lname || null,
      contact_phone1: this.hostForm.contact_phone1 || null,
      contact_phone2: this.hostForm.contact_phone2 || null,
      contact_email: this.hostForm.contact_email || null,
      comment: this.hostForm.comment || null,
      web_url: this.hostForm.web_url || null,
      is_host_plus: this.hostForm.is_host_plus,
      photo: null,
      photo_credit: null,
      created_by: this.currentUserId,
      updated_by: null,
    });

    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Host "${this.hostForm.name}" created successfully.`;
    this.closeCreateModal();
    this.isSaving = false;
    await this.loadData();
  }

  openEditModal(host: TjsHost) {
    this.selectedHost = host;
    this.error = '';
    this.hostForm = {
      name: host.name ?? '',
      public_name: host.public_name ?? '',
      address: host.address ?? '',
      city: host.city ?? '',
      proviance: host.proviance ?? '',
      zip: host.zip ?? '',
      country: host.country ?? '',
      host_per_year: host.host_per_year ?? '',
      capacity: host.capacity,
      id_host_type: host.id_host_type,
      contact_fname: host.contact_fname ?? '',
      contact_lname: host.contact_lname ?? '',
      contact_phone1: host.contact_phone1 ?? '',
      contact_phone2: host.contact_phone2 ?? '',
      contact_email: host.contact_email ?? '',
      comment: host.comment ?? '',
      web_url: host.web_url ?? '',
      is_host_plus: host.is_host_plus ?? false,
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedHost = null;
  }

  async submitEdit() {
    if (!this.selectedHost) {
      return;
    }

    if (!this.hostForm.name.trim()) {
      this.error = 'Host name is required.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    const error = await this.supabase.updateHost(this.selectedHost.id, {
      name: this.hostForm.name,
      public_name: this.hostForm.public_name || null,
      address: this.hostForm.address || null,
      city: this.hostForm.city || null,
      proviance: this.hostForm.proviance || null,
      zip: this.hostForm.zip || null,
      country: this.hostForm.country || null,
      host_per_year: this.hostForm.host_per_year || null,
      capacity: this.hostForm.capacity,
      id_host_type: this.hostForm.id_host_type,
      contact_fname: this.hostForm.contact_fname || null,
      contact_lname: this.hostForm.contact_lname || null,
      contact_phone1: this.hostForm.contact_phone1 || null,
      contact_phone2: this.hostForm.contact_phone2 || null,
      contact_email: this.hostForm.contact_email || null,
      comment: this.hostForm.comment || null,
      web_url: this.hostForm.web_url || null,
      is_host_plus: this.hostForm.is_host_plus,
      created_by: this.selectedHost.created_by ?? this.currentUserId,
      updated_by: this.currentUserId,
    });

    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.successMessage = 'Host updated successfully.';
    this.closeEditModal();
    this.isSaving = false;
    await this.loadData();
  }

  async openMembersModal(host: TjsHost) {
    this.selectedHost = host;
    this.memberSearchQuery = '';
    this.error = '';
    this.showMembersModal = true;
    this.isLoadingMembers = true;
    this.hostMembers = await this.supabase.getHostMembers(host.id);
    this.isLoadingMembers = false;
  }

  closeMembersModal() {
    this.showMembersModal = false;
    this.selectedHost = null;
    this.hostMembers = [];
    this.memberSearchQuery = '';
  }

  async assignMember(profile: TjsProfile) {
    if (!this.selectedHost) {
      return;
    }

    this.isSaving = true;
    this.error = '';

    const error = await this.supabase.assignHostMember(this.selectedHost.id, profile.id);
    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.hostMembers = await this.supabase.getHostMembers(this.selectedHost.id);
    await this.refreshAssignedHostUserIds();
    this.isSaving = false;
    this.successMessage = 'Host user assigned successfully.';
  }

  async removeMember(member: TjsHostMember) {
    if (!this.selectedHost) {
      return;
    }

    this.isSaving = true;
    this.error = '';

    const error = await this.supabase.removeHostMember(member.id);
    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.hostMembers = await this.supabase.getHostMembers(this.selectedHost.id);
    await this.refreshAssignedHostUserIds();
    this.isSaving = false;
    this.successMessage = 'Host user removed successfully.';
  }

  openInviteHostUserModal() {
    this.error = '';
    this.inviteHostUserForm = this.blankInviteHostUserForm();
    this.showInviteHostUserModal = true;
  }

  closeInviteHostUserModal() {
    this.showInviteHostUserModal = false;
  }

  async submitInviteHostUser() {
    if (!this.selectedHost) {
      return;
    }

    const normalizedEmail = this.inviteHostUserForm.email.trim().toLowerCase();
    const fullName = this.inviteHostUserForm.fullName.trim();

    if (!normalizedEmail || !fullName) {
      this.error = 'Email and full name are required.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    if (!this.hostRoleId) {
      this.error = 'Host role not found.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    const redirectTo = this.supabase.getInviteRedirectUrl();
    const { userId, error: inviteError } = await this.supabase.inviteUser(
      normalizedEmail,
      fullName,
      redirectTo
    );

    if (inviteError || !userId) {
      this.error = inviteError ?? 'Unable to invite host user.';
      this.isSaving = false;
      return;
    }

    const profileError = await this.supabase.upsertProfile({
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      phone: this.inviteHostUserForm.phone.trim() || null,
    });

    if (profileError) {
      this.error = profileError;
      this.isSaving = false;
      return;
    }

    const roleError = await this.supabase.assignRole(userId, this.hostRoleId, this.currentUserId);
    if (roleError) {
      this.error = roleError;
      this.isSaving = false;
      return;
    }

    const assignError = await this.supabase.assignHostMember(this.selectedHost.id, userId);
    if (assignError) {
      this.error = assignError;
      this.isSaving = false;
      return;
    }

    this.hostUsers = await this.refreshHostUsers();
    this.hostMembers = await this.supabase.getHostMembers(this.selectedHost.id);
    await this.refreshAssignedHostUserIds();
    this.successMessage = `Host user invited and assigned to ${this.selectedHost.name}.`;
    this.closeInviteHostUserModal();
    this.isSaving = false;
  }

  trackByHost(_: number, host: TjsHost) {
    return host.id;
  }

  trackByMember(_: number, member: TjsHostMember) {
    return member.id;
  }

  trackByUser(_: number, user: TjsUserWithRoles) {
    return user.id;
  }

  private async refreshHostUsers(): Promise<TjsUserWithRoles[]> {
    const users = await this.supabase.listAllUsersWithRoles();
    return users.filter((user) => this.hasHostRole(user));
  }

  private async refreshAssignedHostUserIds(): Promise<void> {
    const allHostMembers = await this.supabase.getAllHostMembers();
    this.assignedHostUserIds = Array.from(new Set(allHostMembers.map((member) => member.profile_id).filter(Boolean)));
  }

  private hasHostRole(user: TjsUserWithRoles): boolean {
    return user.roles.some((role) => role.name === 'Host' || role.name === 'Host+');
  }

  private blankForm(): HostForm {
    return {
      name: '',
      public_name: '',
      address: '',
      city: '',
      proviance: '',
      zip: '',
      country: '',
      host_per_year: '',
      capacity: null,
      id_host_type: null,
      contact_fname: '',
      contact_lname: '',
      contact_phone1: '',
      contact_phone2: '',
      contact_email: '',
      comment: '',
      web_url: '',
      is_host_plus: false,
    };
  }

  private blankInviteHostUserForm(): InviteHostUserForm {
    return {
      email: '',
      fullName: '',
      phone: '',
    };
  }
}
