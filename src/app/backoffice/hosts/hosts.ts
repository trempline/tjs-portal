import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  SupabaseService,
  TjsHost,
  TjsHostPlusDatabaseSettings,
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

interface HostPlusDatabaseSettingsForm {
  database_label: string;
  supabase_url: string;
  supabase_anon_key: string;
  schema_name: string;
  is_active: boolean;
  notes: string;
}

@Component({
  selector: 'app-hosts',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './hosts.html',
})
export class Hosts implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
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
  isHostPlusPage = false;

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showMembersModal = false;
  showDeleteConfirm = false;

  selectedHost: TjsHost | null = null;
  hostForm: HostForm = this.blankForm();
  hostPlusSettingsForm: HostPlusDatabaseSettingsForm = this.blankHostPlusSettingsForm();
  selectedHostPlusSettings: TjsHostPlusDatabaseSettings | null = null;

  // Members modal
  hostMembers: TjsHostMember[] = [];
  allProfiles: TjsProfile[] = [];
  hostManagers: TjsProfile[] = [];
  memberSearchQuery = '';
  isLoadingMembers = false;

  // ── Computed ───────────────────────────────────────────────────────────

  get pageTitle(): string {
    return this.isHostPlusPage ? 'Host+' : 'Hôtes';
  }

  get pageDescription(): string {
    return this.isHostPlusPage
      ? 'Gérez les Host+ et leurs paramètres de base de données.'
      : 'Gérez les hôtes qui accueillent des concerts à domicile.';
  }

  get createButtonLabel(): string {
    return this.isHostPlusPage ? 'Ajouter un Host+' : 'Ajouter un hôte';
  }

  get createSubmitLabel(): string {
    return this.isHostPlusPage ? 'Créer le Host+' : 'Créer l\'hôte';
  }

  get editModalTitle(): string {
    return this.isHostPlusPage ? 'Modifier le Host+' : 'Modifier l\'hôte';
  }

  get createModalTitle(): string {
    return this.isHostPlusPage ? 'Ajouter un Host+' : 'Ajouter un hôte';
  }

  get emptyTitle(): string {
    return this.isHostPlusPage ? 'Aucun Host+' : 'Aucun hôte';
  }

  get emptyDescription(): string {
    return this.isHostPlusPage
      ? 'Il n\'y a pas encore de Host+ enregistré.'
      : 'Il n\'y a pas encore d\'hôtes enregistrés.';
  }

  get showHostPlusDatabaseSettings(): boolean {
    return this.isHostPlusPage || this.hostForm.is_host_plus;
  }

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

  async openHostPlusEvents(host: TjsHost) {
    if (!host.is_host_plus) {
      return;
    }

    await this.router.navigate(['/backoffice/host-plus', host.id, 'events']);
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  async ngOnInit() {
    this.isHostPlusPage = this.route.snapshot.data['hostPlus'] === true;
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
    this.hosts = hosts.filter((host) =>
      this.isHostPlusPage ? !!host.is_host_plus : !host.is_host_plus
    );
    this.hostTypes = hostTypes;
    this.hostManagers = users.filter((user) =>
      user.roles.some((role) => role.name.toLowerCase() === 'host manager')
    );
    this.isLoading = false;
  }

  // ── Create ─────────────────────────────────────────────────────────────

  openCreateModal() {
    this.hostForm = this.blankForm();
    this.hostPlusSettingsForm = this.blankHostPlusSettingsForm();
    this.selectedHostPlusSettings = null;
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

    const { id: hostId, error } = await this.supabase.createHost({
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
      is_host_plus: this.isHostPlusPage ? true : this.hostForm.is_host_plus,
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

    if (this.isHostPlusPage && hostId) {
      const settingsError = await this.saveHostPlusDatabaseSettings(hostId);
      if (settingsError) {
        this.error = settingsError;
        this.isSaving = false;
        return;
      }
    }

    this.successMessage = this.isHostPlusPage
      ? `Host+ "${this.hostForm.name}" créé avec succès !`
      : `Hôte « ${this.hostForm.name} » créé avec succès !`;
    this.showCreateModal = false;
    this.isSaving = false;
    await this.loadData();
    setTimeout(() => (this.successMessage = ''), 5000);
  }

  // ── View ───────────────────────────────────────────────────────────────

  async openViewModal(host: TjsHost) {
    this.selectedHost = host;
    this.selectedHostPlusSettings = null;
    this.error = '';
    this.isLoadingMembers = true;
    this.showViewModal = true;

    const [members, settings] = await Promise.all([
      this.supabase.getHostMembers(host.id),
      host.is_host_plus ? this.supabase.getHostPlusDatabaseSettings(host.id) : Promise.resolve(null),
    ]);
    this.hostMembers = members;
    this.selectedHostPlusSettings = settings;
    this.isLoadingMembers = false;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedHost = null;
    this.hostMembers = [];
    this.selectedHostPlusSettings = null;
  }

  // ── Edit ───────────────────────────────────────────────────────────────

  async openEditModal(host: TjsHost) {
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
    this.hostPlusSettingsForm = this.blankHostPlusSettingsForm();
    this.selectedHostPlusSettings = null;
    this.error = '';
    this.showEditModal = true;
    if (host.is_host_plus) {
      const settings = await this.supabase.getHostPlusDatabaseSettings(host.id);
      this.selectedHostPlusSettings = settings;
      this.hostPlusSettingsForm = this.settingsFormFromRecord(settings);
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedHost = null;
    this.selectedHostPlusSettings = null;
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
      is_host_plus: this.isHostPlusPage ? true : this.hostForm.is_host_plus,
      created_by: this.hostForm.manager_user_id || this.currentUserId,
      updated_by: this.currentUserId,
    });

    if (err) {
      this.error = err;
    } else {
      if (this.isHostPlusPage || this.hostForm.is_host_plus) {
        const settingsError = await this.saveHostPlusDatabaseSettings(this.selectedHost.id);
        if (settingsError) {
          this.error = settingsError;
          this.isSaving = false;
          return;
        }
      }

      this.successMessage = this.isHostPlusPage
        ? 'Host+ mis à jour avec succès.'
        : 'Hôte mis à jour avec succès.';
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
      this.successMessage = this.isHostPlusPage
        ? `Host+ "${this.selectedHost.name}" supprimé.`
        : `Hôte « ${this.selectedHost.name} » supprimé.`;
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
      profile.id,
      'member',
      this.currentUserId
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

  maskSettingValue(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    if (value.length <= 12) {
      return '****';
    }

    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  private async saveHostPlusDatabaseSettings(hostId: number): Promise<string | null> {
    return this.supabase.upsertHostPlusDatabaseSettings(
      hostId,
      {
        database_label: this.hostPlusSettingsForm.database_label.trim() || null,
        supabase_url: this.hostPlusSettingsForm.supabase_url.trim() || null,
        supabase_anon_key: this.hostPlusSettingsForm.supabase_anon_key.trim() || null,
        schema_name: this.hostPlusSettingsForm.schema_name.trim() || 'public',
        is_active: this.hostPlusSettingsForm.is_active,
        notes: this.hostPlusSettingsForm.notes.trim() || null,
      },
      this.currentUserId
    );
  }

  private settingsFormFromRecord(settings: TjsHostPlusDatabaseSettings | null): HostPlusDatabaseSettingsForm {
    return {
      database_label: settings?.database_label ?? '',
      supabase_url: settings?.supabase_url ?? '',
      supabase_anon_key: settings?.supabase_anon_key ?? '',
      schema_name: settings?.schema_name ?? 'public',
      is_active: settings?.is_active ?? true,
      notes: settings?.notes ?? '',
    };
  }

  private blankHostPlusSettingsForm(): HostPlusDatabaseSettingsForm {
    return {
      database_label: '',
      supabase_url: '',
      supabase_anon_key: '',
      schema_name: 'public',
      is_active: true,
      notes: '',
    };
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
      is_host_plus: this.isHostPlusPage,
      manager_user_id: null,
    };
  }
}
