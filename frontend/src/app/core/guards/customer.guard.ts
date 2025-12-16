import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const customerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUser().pipe(
    take(1),
    map((user) => {
      // If user is logged in AND is an ADMIN, they shouldn't be here (e.g. checkout)
      if (user && user.role === 'ADMIN') {
        // Redirect Admin to their dashboard
        return router.createUrlTree(['/admin']);
      }
      // Guest or Customer -> Allow access
      return true;
    })
  );
};
