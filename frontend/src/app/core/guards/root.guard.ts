import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const rootGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUser().pipe(
    take(1),
    map((user) => {
      // If Admin tries to access root '/', send them to /admin
      if (user && user.role === 'ADMIN') {
        return router.createUrlTree(['/admin']);
      }
      // Everyone else (Guest/Customer) stays on Home
      return true;
    })
  );
};
