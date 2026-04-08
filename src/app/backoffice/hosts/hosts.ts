import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  SupabaseService,
  TjsHost,
  SysHostType,
  TjsHostMember,
  TjsProfile,
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
  manager_user_id: string | null;
}

@Component({
  selector: 'app-hosts',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './hosts.html',
})
export class Hosts implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  // ── State ──────────────────────────────────────────────────────────────
  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  hosts: TjsHost[] = [];
  hostTypes: SysHostType[] = [];
  searchQuery = '';

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showMembersModal = false;
  showDeleteConfirm = false;

  selectedHost: TjsHost | null = null;
  hostForm: HostForm = this.blankForm();

  // Members modal
  hostMembers: TjsHostMember[] = [];
  allProfiles: TjsProfile[] = [];
  hostManagers: TjsProfile[] = [];
  memberSearchQuery = '';
  isLoadingMembers = false;

  // ── Computed ───────────────────────────────────────────────────────────

  get filteredHosts(): TjsHost[] {
    if (!this.searchQuery.trim()) return this.hosts;
    const q = this.searchQuery.toLowerCase();
    return this.hosts.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        h.city?.toLowerCase().includes(q) ||
        h.contact_email?.toLowerCase().includes(q) ||
        h.public_name?.toLowerCase().includes(q)
    );
  }

  get hostTypeName(): (id: number | null) => string {
    return (id) => {
      if (!id) return '—';
      return this.hostTypes.find((t) => t.id === id)?.name ?? '—';
    };
  }

  get availableProfiles(): TjsProfile[] {
    const assignedIds = new Set(this.hostMembers.map((m) => m.profile_id));
    let profiles = this.allProfiles.filter((p) => !assignedIds.has(p.id));
    if (this.memberSearchQuery.trim()) {
      const q = this.memberSearchQuery.toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }
    return profiles;
  }

  countByType(typeId: number): number {
    return this.hosts.filter((h) => h.id_host_type === typeId).length;
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    this.isLoading = true;
    this.error = '';
    const [hosts, hostTypes, users] = await Promise.all([
      this.supabase.getHosts(),
      this.supabase.getHostTypes(),
      this.supabase.listAllUsersWithRoles(),
    ]);
    this.hosts = hosts;
    this.hostTypes = hostTypes;
    this.hostManagers = users.filter((user) =>
      user.roles.some((role) => role.name.toLowerCase() === 'host manager')
    );
    this.isLoading = false;
  }

  // ── Create ─────────────────────────────────────────────────────────────

  openCreateModal() {
    this.hostForm = this.blankForm();
    this.error = '';
    this.successMessage = '';
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  async submitCreate() {
    if (!this.hostForm.name.trim()) {
      this.error = 'Le nom est obligatoire.';
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
      created_by: this.hostForm.manager_user_id || this.currentUserId,
      updated_by: null,
    });

    if (error) {
      this.error = error;
      this.isSaving = false;
      return;
    }

    this.successMessage = `Hôte « ${this.hostForm.name} » créé avec succès !`;
    this.showCreateModal = false;
    this.isSaving = false;
    await this.loadData();
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  // ── View ───────────────────────────────────────────────────────────────

  async openViewModal(host: TjsHost) {
    this.selectedHost = host;
    this.error = '';
    this.isLoadingMembers = true;
    this.showViewModal = true;

    this.hostMembers = await this.supabase.getHostMembers(host.id);
    this.isLoadingMembers = false;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedHost = null;
    this.hostMembers = [];
  }

  // ── Edit ───────────────────────────────────────────────────────────────

  openEditModal(host: TjsHost) {
    this.selectedHost = host;
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
      manager_user_id: host.created_by,
    };
    this.error = '';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedHost = null;
  }

  async submitEdit() {
    if (!this.selectedHost) return;
    if (!this.hostForm.name.trim()) {
      this.error = 'Le nom est obligatoire.';
      return;
    }

    this.isSaving = true;
    this.error = '';

    const err = await this.supabase.updateHost(this.selectedHost.id, {
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
      created_by: this.hostForm.manager_user_id || this.currentUserId,
      updated_by: this.currentUserId,
    });

    if (err) {
      this.error = err;
    } else {
      this.successMessage = 'Hôte mis à jour avec succès.';
      this.showEditModal = false;
      this.selectedHost = null;
      await this.loadData();
      setTimeout(() => (this.successMessage = ''), 4000);
    }
    this.isSaving = false;
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  confirmDelete(host: TjsHost) {
    this.selectedHost = host;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.selectedHost = null;
  }

  async submitDelete() {
    if (!this.selectedHost) return;
    this.isSaving = true;
    this.error = '';

    const err = await this.supabase.deleteHost(this.selectedHost.id);
    if (err) {
      this.error = err;
    } else {
      this.successMessage = `Hôte « ${this.selectedHost.name} » supprimé.`;
      await this.loadData();
      setTimeout(() => (this.successMessage = ''), 4000);
    }
    this.showDeleteConfirm = false;
    this.selectedHost = null;
    this.isSaving = false;
  }

  // ── Members ────────────────────────────────────────────────────────────

  async openMembersModal(host: TjsHost) {
    this.selectedHost = host;
    this.memberSearchQuery = '';
    this.isLoadingMembers = true;
    this.error = '';
    this.showMembersModal = true;

    const [members, profiles] = await Promise.all([
      this.supabase.getHostMembers(host.id),
      this.supabase.listAllUsersWithRoles(),
    ]);
    this.hostMembers = members;
    this.allProfiles = profiles;
    this.isLoadingMembers = false;
  }

  closeMembersModal() {
    this.showMembersModal = false;
    this.selectedHost = null;
    this.hostMembers = [];
    this.allProfiles = [];
  }

  async assignMember(profile: TjsProfile) {
    if (!this.selectedHost) return;
    this.isSaving = true;
    this.error = '';

    const err = await this.supabase.assignHostMember(
      this.selectedHost.id,
      profile.id
    );
    if (err) {
      this.error = err;
    } else {
      this.hostMembers = await this.supabase.getHostMembers(
        this.selectedHost.id
      );
    }
    this.isSaving = false;
  }

  async removeMember(member: TjsHostMember) {
    this.isSaving = true;
    this.error = '';

    const err = await this.supabase.removeHostMember(member.id);
    if (err) {
      this.error = err;
    } else if (this.selectedHost) {
      this.hostMembers = await this.supabase.getHostMembers(
        this.selectedHost.id
      );
    }
    this.isSaving = false;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  avatarLetter(name: string | null): string {
    return name ? name.charAt(0).toUpperCase() : '?';
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
      manager_user_id: null,
    };
  }
}
