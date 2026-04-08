import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

async function waitForAuthReady(authService: AuthService): Promise<void> {
  let attempts = 0;
  while (authService.currentState.isLoading && attempts < 20) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }
}

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await waitForAuthReady(authService);

  if (authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/admin']);
};

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    await waitForAuthReady(authService);

    if (!authService.isAuthenticated) {
      return router.createUrlTree(['/admin']);
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    return router.createUrlTree([authService.getPostLoginRoute()]);
  };
}
