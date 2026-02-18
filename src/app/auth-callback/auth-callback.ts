import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

type PageState = 'loading' | 'set-password' | 'success' | 'error';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [NgIf, NgClass, NgFor, FormsModule],
  templateUrl: './auth-callback.html',
})
export class AuthCallback implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  state: PageState = 'loading';
  errorMessage = '';
  isSaving = false;
  showPassword = false;
  showConfirm = false;

  newPassword = '';
  confirmPassword = '';

  async ngOnInit() {
    // Supabase appends the token as a URL fragment (#access_token=...&type=invite)
    // The Supabase JS client automatically picks up the fragment and creates a session.
    // We just need to wait for it.
    await this.waitForSession();
  }

  private async waitForSession(attempts = 0): Promise<void> {
    const session = await this.supabaseService.getSession();

    if (session?.user) {
      // Session established — show the set-password form
      this.state = 'set-password';
      return;
    }

    if (attempts < 30) {
      await new Promise(r => setTimeout(r, 300));
      return this.waitForSession(attempts + 1);
    }

    // Could not establish session
    this.errorMessage = 'Le lien d\'invitation a expiré ou est invalide. Veuillez contacter un administrateur.';
    this.state = 'error';
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirm()  { this.showConfirm  = !this.showConfirm; }

  get passwordStrength(): { score: number; label: string; color: string } {
    const p = this.newPassword;
    let score = 0;
    if (p.length >= 8)  score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { score, label: 'Faible',  color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Moyen',   color: 'bg-yellow-400' };
    if (score === 3) return { score, label: 'Bien',    color: 'bg-blue-500' };
    return             { score, label: 'Fort',    color: 'bg-green-500' };
  }

  async submitPassword() {
    this.errorMessage = '';

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSaving = true;

    // Use the Supabase client directly via the service getter
    // We need access to the raw client — expose a helper in SupabaseService
    const err = await this.supabaseService.updateCurrentUserPassword(this.newPassword);

    if (err) {
      this.errorMessage = err;
      this.isSaving = false;
      return;
    }

    this.state = 'success';
    this.isSaving = false;

    // Redirect to backoffice after 2 s
    setTimeout(() => this.router.navigate(['/backoffice/dashboard']), 2000);
  }

  goToLogin() {
    this.router.navigate(['/admin']);
  }
}
