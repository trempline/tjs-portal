import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { WorkspaceEditActions } from '../../shared/workspace-edit/workspace-edit-actions';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseService, TjsHost } from '../../services/supabase.service';

interface HostPlusHomeForm {
  name: string;
  public_name: string;
  address: string;
  city: string;
  proviance: string;
  zip: string;
  country: string;
  host_per_year: string;
  capacity: number | null;
  contact_fname: string;
  contact_lname: string;
  contact_phone1: string;
  contact_phone2: string;
  contact_email: string;
  web_url: string;
  comment: string;
}

@Component({
  selector: 'app-host-plus-home',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink, WorkspaceEditActions],
  templateUrl: './host-plus-home.html',
})
export class HostPlusHome implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  host: TjsHost | null = null;
  form: HostPlusHomeForm = this.blankForm();
  isLoading = true;
  isSaving = false;
  isEditing = false;
  error = '';
  successMessage = '';

  async ngOnInit() {
    await this.loadData();
  }

  get hostName(): string {
    return this.host?.public_name || this.host?.name || 'Host+';
  }

  get currentUserId(): string {
    return this.authService.currentUser?.id ?? '';
  }

  async loadData() {
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    try {
      const host = await this.resolveCurrentHostPlus();
      this.host = host;

      if (!host) {
        this.error = 'No Host+ record is assigned to your account.';
        return;
      }

      this.form = this.formFromHost(host);
      this.isEditing = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Host+ details could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  async saveDetails() {
    if (!this.host || !this.isEditing) {
      return;
    }

    if (!this.form.name.trim()) {
      this.error = 'Host+ name is required.';
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    const error = await this.supabase.updateHost(this.host.id, {
      name: this.form.name.trim(),
      public_name: this.nullable(this.form.public_name),
      address: this.nullable(this.form.address),
      city: this.nullable(this.form.city),
      proviance: this.nullable(this.form.proviance),
      zip: this.nullable(this.form.zip),
      country: this.nullable(this.form.country),
      host_per_year: this.nullable(this.form.host_per_year),
      capacity: this.form.capacity,
      contact_fname: this.nullable(this.form.contact_fname),
      contact_lname: this.nullable(this.form.contact_lname),
      contact_phone1: this.nullable(this.form.contact_phone1),
      contact_phone2: this.nullable(this.form.contact_phone2),
      contact_email: this.nullable(this.form.contact_email),
      web_url: this.nullable(this.form.web_url),
      comment: this.nullable(this.form.comment),
      is_host_plus: true,
      updated_by: this.currentUserId,
    });

    if (error) {
      this.error = error;
    } else {
      this.successMessage = 'Host+ details updated successfully.';
      const refreshedHost = await this.supabase.getHost(this.host.id);
      if (refreshedHost) {
        this.host = refreshedHost;
        this.form = this.formFromHost(refreshedHost);
      }
      this.isEditing = false;
    }

    this.isSaving = false;
  }

  startEditing() {
    this.error = '';
    this.successMessage = '';
    this.isEditing = true;
  }

  cancelEditing() {
    if (this.host) {
      this.form = this.formFromHost(this.host);
    }
    this.error = '';
    this.isEditing = false;
  }

  private async resolveCurrentHostPlus(): Promise<TjsHost | null> {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      return null;
    }

    const hosts = await this.supabase.getMyHosts(profileId);
    return hosts.find((host) => host.is_host_plus) ?? null;
  }

  private formFromHost(host: TjsHost): HostPlusHomeForm {
    return {
      name: host.name ?? '',
      public_name: host.public_name ?? '',
      address: host.address ?? '',
      city: host.city ?? '',
      proviance: host.proviance ?? '',
      zip: host.zip ?? '',
      country: host.country ?? '',
      host_per_year: host.host_per_year ?? '',
      capacity: host.capacity,
      contact_fname: host.contact_fname ?? '',
      contact_lname: host.contact_lname ?? '',
      contact_phone1: host.contact_phone1 ?? '',
      contact_phone2: host.contact_phone2 ?? '',
      contact_email: host.contact_email ?? '',
      web_url: host.web_url ?? '',
      comment: host.comment ?? '',
    };
  }

  private blankForm(): HostPlusHomeForm {
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
      contact_fname: '',
      contact_lname: '',
      contact_phone1: '',
      contact_phone2: '',
      contact_email: '',
      web_url: '',
      comment: '',
    };
  }

  private nullable(value: string): string | null {
    return value.trim() || null;
  }
}
