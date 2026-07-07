import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { WorkspaceEditButton } from '../../shared/workspace-edit/workspace-edit-button';
import { WorkspaceCancelButton } from '../../shared/workspace-edit/workspace-cancel-button';
import { WorkspaceSaveButton } from '../../shared/workspace-edit/workspace-save-button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  SaveHostPlusDatabaseSettingsInput,
  SupabaseService,
  TjsHost,
  TjsHostPlusDatabaseSettings,
} from '../../services/supabase.service';

interface HostPlusDatabaseSettingsForm {
  database_label: string;
  supabase_url: string;
  supabase_anon_key: string;
  schema_name: string;
  is_active: boolean;
  notes: string;
}

@Component({
  selector: 'app-host-plus-settings',
  standalone: true,
  imports: [NgIf, FormsModule, WorkspaceEditButton, WorkspaceCancelButton, WorkspaceSaveButton],
  templateUrl: './host-plus-settings.html',
})
export class HostPlusSettings implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  host: TjsHost | null = null;
  databaseSettings: TjsHostPlusDatabaseSettings | null = null;
  databaseForm: HostPlusDatabaseSettingsForm = this.blankDatabaseForm();
  newPassword = '';
  confirmPassword = '';
  isLoading = true;
  isSavingPassword = false;
  isSavingDatabase = false;
  isEditingPassword = false;
  isEditingDatabase = false;
  error = '';
  passwordError = '';
  databaseError = '';
  passwordSuccess = '';
  databaseSuccess = '';

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
    this.passwordError = '';
    this.databaseError = '';

    try {
      const host = await this.resolveCurrentHostPlus();
      this.host = host;

      if (!host) {
        this.error = 'No Host+ record is assigned to your account.';
        return;
      }

      this.databaseSettings = await this.supabase.getHostPlusDatabaseSettings(host.id);
      this.databaseForm = this.formFromSettings(this.databaseSettings);
      this.isEditingPassword = false;
      this.isEditingDatabase = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Host+ settings could not be loaded.';
    } finally {
      this.isLoading = false;
    }
  }

  async changePassword() {
    if (!this.isEditingPassword) {
      return;
    }

    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.newPassword || this.newPassword.length < 6) {
      this.passwordError = 'Password must be at least 6 characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }

    this.isSavingPassword = true;
    const error = await this.supabase.updateCurrentUserPassword(this.newPassword);

    if (error) {
      this.passwordError = error;
    } else {
      this.passwordSuccess = 'Password updated successfully.';
      this.newPassword = '';
      this.confirmPassword = '';
      this.isEditingPassword = false;
    }

    this.isSavingPassword = false;
  }

  async saveDatabaseSettings() {
    if (!this.host || !this.isEditingDatabase) {
      return;
    }

    this.databaseError = '';
    this.databaseSuccess = '';
    this.isSavingDatabase = true;

    const payload: SaveHostPlusDatabaseSettingsInput = {
      database_label: this.nullable(this.databaseForm.database_label),
      supabase_url: this.nullable(this.databaseForm.supabase_url),
      supabase_anon_key: this.nullable(this.databaseForm.supabase_anon_key),
      schema_name: this.databaseForm.schema_name.trim() || 'public',
      is_active: this.databaseForm.is_active,
      notes: this.nullable(this.databaseForm.notes),
    };

    const error = await this.supabase.upsertHostPlusDatabaseSettings(
      this.host.id,
      payload,
      this.currentUserId
    );

    if (error) {
      this.databaseError = error;
    } else {
      this.databaseSettings = await this.supabase.getHostPlusDatabaseSettings(this.host.id);
      this.databaseForm = this.formFromSettings(this.databaseSettings);
      this.databaseSuccess = 'Database settings updated successfully.';
      this.isEditingDatabase = false;
    }

    this.isSavingDatabase = false;
  }

  startPasswordEdit() {
    this.passwordError = '';
    this.passwordSuccess = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.isEditingPassword = true;
  }

  cancelPasswordEdit() {
    this.passwordError = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.isEditingPassword = false;
  }

  startDatabaseEdit() {
    this.databaseError = '';
    this.databaseSuccess = '';
    this.isEditingDatabase = true;
  }

  cancelDatabaseEdit() {
    this.databaseError = '';
    this.databaseForm = this.formFromSettings(this.databaseSettings);
    this.isEditingDatabase = false;
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

  private formFromSettings(settings: TjsHostPlusDatabaseSettings | null): HostPlusDatabaseSettingsForm {
    return {
      database_label: settings?.database_label ?? '',
      supabase_url: settings?.supabase_url ?? '',
      supabase_anon_key: settings?.supabase_anon_key ?? '',
      schema_name: settings?.schema_name ?? 'public',
      is_active: settings?.is_active ?? true,
      notes: settings?.notes ?? '',
    };
  }

  private blankDatabaseForm(): HostPlusDatabaseSettingsForm {
    return {
      database_label: '',
      supabase_url: '',
      supabase_anon_key: '',
      schema_name: 'public',
      is_active: true,
      notes: '',
    };
  }

  private nullable(value: string): string | null {
    return value.trim() || null;
  }
}
