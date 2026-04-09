import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ArtistWorkspaceRequirements,
  SupabaseService,
} from '../../services/supabase.service';

@Component({
  selector: 'app-artist-requirements',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './artist-requirements.html',
})
export class ArtistRequirements implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  isLoading = true;
  isSaving = false;
  isEditing = false;
  error = '';
  successMessage = '';

  requirements: ArtistWorkspaceRequirements = this.blankRequirements('');

  async ngOnInit() {
    await this.authService.waitForAuthReady();

    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist requirements could not be loaded.';
      this.isLoading = false;
      return;
    }

    await this.loadRequirements(profileId);
  }

  async save() {
    this.error = '';
    this.successMessage = '';

    this.requirements.rib_number = this.normalizeIdentifier(this.requirements.rib_number);
    this.requirements.guso_number = this.normalizeIdentifier(this.requirements.guso_number);
    this.requirements.security_number = this.normalizeIdentifier(this.requirements.security_number);

    this.isSaving = true;
    const error = await this.supabase.saveArtistWorkspaceRequirements(this.requirements);
    if (error) {
      this.error = error;
    } else {
      this.successMessage = 'Artist requirements saved successfully.';
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
    void this.reload();
  }

  private blankRequirements(profileId: string): ArtistWorkspaceRequirements {
    return {
      profile_id: profileId,
      rib_number: '',
      guso_number: '',
      security_number: '',
      allergies: '',
      food_restriction: '',
      additional_requirements: '',
    };
  }

  private async reload() {
    const profileId = this.authService.currentUser?.id;
    if (!profileId) {
      this.error = 'Artist requirements could not be loaded.';
      return;
    }

    this.isEditing = false;
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    await this.loadRequirements(profileId);
  }

  private async loadRequirements(profileId: string) {
    const requirements = await this.supabase.getArtistWorkspaceRequirements(profileId);
    this.requirements = requirements ?? this.blankRequirements(profileId);
    this.isLoading = false;
  }

  private normalizeIdentifier(value: string): string {
    return value.replace(/\s+/g, '').trim();
  }

  maskIdentifier(value: string): string {
    const normalized = this.normalizeIdentifier(value);
    if (!normalized) {
      return '';
    }

    if (normalized.length <= 4) {
      return '•'.repeat(normalized.length);
    }

    return `${'•'.repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
  }
}
