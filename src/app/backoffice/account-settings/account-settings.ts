import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './account-settings.html',
})
export class AccountSettings {
  authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  newPassword = '';
  confirmPassword = '';
  error = '';
  successMessage = '';
  isSaving = false;

  async submitChangePassword() {
    this.error = '';
    this.successMessage = '';

    if (!this.newPassword || this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.isSaving = true;
    const result = await this.supabase.updateCurrentUserPassword(this.newPassword);
    if (result) {
      this.error = result;
    } else {
      this.successMessage = 'Password updated successfully.';
      this.newPassword = '';
      this.confirmPassword = '';
    }
    this.isSaving = false;
  }
}
