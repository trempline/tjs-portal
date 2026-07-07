import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

export type LoginRole = 'admin' | 'artist' | 'host' | 'host-plus' | 'host-manager' | 'committee';

interface LoginRoleOption {
  value: LoginRole;
  label: string;
}

@Component({
  selector: 'app-login',
  imports: [SharedModule, RouterModule, FormsModule, NgIf, NgFor],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly roleOptions: LoginRoleOption[] = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'artist', label: 'Artiste' },
    { value: 'host', label: 'Hôte' },
    { value: 'host-plus', label: 'Hôte+' },
    { value: 'host-manager', label: 'Gestionnaire d\'hôtes' },
    { value: 'committee', label: 'Membre du comité' },
  ];

  selectedRole: LoginRole = 'admin';

  credentials = {
    email: '',
    password: '',
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;

  showForgotPassword = false;
  forgotEmail = '';
  forgotLoading = false;
  forgotMessage = '';
  forgotError = '';

  ngOnInit() {
    const fromQuery = this.route.snapshot.queryParamMap.get('role');
    const fromRoute = this.route.snapshot.data['defaultRole'] as LoginRole | undefined;
    const candidate = fromQuery || fromRoute || 'admin';

    if (this.roleOptions.some((option) => option.value === candidate)) {
      this.selectedRole = candidate as LoginRole;
    }
  }

  get selectedRoleLabel(): string {
    return this.roleOptions.find((option) => option.value === this.selectedRole)?.label ?? '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email)) {
      this.errorMessage = 'Veuillez entrer une adresse email valide.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const result = await this.authService.signIn(
      this.credentials.email,
      this.credentials.password
    );

    if (!result.success) {
      this.errorMessage = this.mapError(result.error);
      this.isLoading = false;
      return;
    }

    await this.authService.waitForAuthReady();

    const roleError = this.validateSelectedRole();
    if (roleError) {
      await this.supabaseService.signOut();
      this.errorMessage = roleError;
      this.isLoading = false;
      return;
    }

    await this.router.navigate([this.getRouteForSelectedRole()]);
    this.isLoading = false;
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.forgotEmail = this.credentials.email;
    this.forgotMessage = '';
    this.forgotError = '';
  }

  async onForgotPassword() {
    if (!this.forgotEmail) {
      this.forgotError = 'Veuillez entrer votre adresse email.';
      return;
    }

    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotMessage = '';

    const redirectTo = `${window.location.origin}/auth/callback`;
    const error = await this.supabaseService.sendPasswordResetEmail(this.forgotEmail, redirectTo);

    if (error) {
      this.forgotError = error;
    } else {
      this.forgotMessage = 'Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.';
    }

    this.forgotLoading = false;
  }

  private validateSelectedRole(): string | null {
    switch (this.selectedRole) {
      case 'admin':
        return this.authService.isAdmin
          ? null
          : 'Cette connexion est réservée aux administrateurs.';

      case 'artist':
        return this.authService.isArtist
          ? null
          : 'Cette connexion est réservée aux artistes.';

      case 'host':
        if (this.authService.isHostManager) {
          return 'Cette connexion est réservée aux hôtes. Veuillez sélectionner « Gestionnaire d\'hôtes ».';
        }
        if (this.authService.hasRole('Host+')) {
          return 'Cette connexion est réservée aux hôtes. Veuillez sélectionner « Hôte+ ».';
        }
        return this.authService.hasRole('Host')
          ? null
          : 'Cette connexion est réservée aux hôtes.';

      case 'host-plus':
        if (this.authService.isHostManager) {
          return 'Cette connexion est réservée aux hôtes+. Veuillez sélectionner « Gestionnaire d\'hôtes ».';
        }
        return this.authService.hasRole('Host+')
          ? null
          : 'Cette connexion est réservée aux hôtes+.';

      case 'host-manager':
        return this.authService.isHostManager
          ? null
          : 'Cette connexion est réservée aux gestionnaires d\'hôtes.';

      case 'committee':
        return this.authService.isCommitteeMember
          ? null
          : 'Cette connexion est réservée aux membres du comité.';

      default:
        return 'Rôle invalide.';
    }
  }

  private getRouteForSelectedRole(): string {
    switch (this.selectedRole) {
      case 'admin':
        return '/backoffice/dashboard';
      case 'artist':
        return '/backoffice/artist-dashboard';
      case 'host':
        return '/backoffice/host/dashboard';
      case 'host-plus':
        return '/backoffice/host-plus/home';
      case 'host-manager':
        return '/backoffice/host-manager';
      case 'committee':
        return '/backoffice/committee-dashboard';
      default:
        return this.authService.getPostLoginRoute();
    }
  }

  private mapError(error: string | null): string {
    if (!error) return 'Une erreur est survenue.';
    if (error.toLowerCase().includes('invalid login') || error.toLowerCase().includes('invalid credentials')) {
      return 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.';
    }
    if (error.toLowerCase().includes('email not confirmed')) {
      return 'Votre adresse email n\'a pas encore été confirmée.';
    }
    if (error.toLowerCase().includes('too many requests')) {
      return 'Trop de tentatives. Veuillez patienter quelques minutes.';
    }
    return error;
  }
}