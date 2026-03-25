import { Component, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [SharedModule, RouterModule, FormsModule, NgIf],
  templateUrl: './admin-login.html',
})
export class AdminLogin {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = {
    email: '',
    password: '',
  };

  isLoading = false;
  errorMessage = '';
  showPassword = false;

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

    if (result.success) {
      await this.authService.waitForAuthReady();
      this.router.navigate([this.authService.getPostLoginRoute()]);
    } else {
      this.errorMessage = this.mapError(result.error);
    }

    this.isLoading = false;
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
