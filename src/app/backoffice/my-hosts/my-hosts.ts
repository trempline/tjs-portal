import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  SupabaseService,
  TjsHost,
  SysHostType,
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

@Component({
  selector: 'app-my-hosts',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './my-hosts.html',
})
export class MyHosts implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  // ── State ──────────────────────────────────────────────────────────────
  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  hosts: TjsHost[] = [];
  hostTypes: SysHostType[] = [];

  // Modals
  showViewModal = false;
  showEditModal = false;
  selectedHost: TjsHost | null = null;
  hostForm: HostForm = this.blankForm();

  // ── Computed ───────────────────────────────────────────────────────────

  get hostTypeName(): (id: number | null) => string {
    return (id) => {
      if (!id) return '—';
      return this.hostTypes.find((t) => t.id === id)?.name ?? '—';
    };
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
    const userId = this.currentUserId;
    if (!userId) {
      this.isLoading = false;
      return;
    }
    const [hosts, hostTypes] = await Promise.all([
      this.supabase.getMyHosts(userId),
      this.supabase.getHostTypes(),
    ]);
    this.hosts = hosts;
    this.hostTypes = hostTypes;
    this.isLoading = false;
  }

  // ── View ───────────────────────────────────────────────────────────────

  openViewModal(host: TjsHost) {
    this.selectedHost = host;
    this.error = '';
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedHost = null;
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
    };
  }
}
