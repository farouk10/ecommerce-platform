import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { take, map } from 'rxjs/operators';

export const notFoundGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getUser().pipe(
    take(1),
    map(user => {
      if (user?.role === 'ADMIN') {
        return router.createUrlTree(['/admin/dashboard']);
      }
      // Client ou inconnu
      return router.createUrlTree(['/']);
    })
  );
};
