import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for the initial loading to finish (session restore)
  let attempts = 0;
  while (authService.currentState.isLoading && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/admin']);
};
