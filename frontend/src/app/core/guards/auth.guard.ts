import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Récupérer les rôles requis depuis la config de la route
  const requiredRoles = route.data['roles'] as Array<string>;

  return authService.currentUser$.pipe(
    // Optionnel: filtrer si vous avez un état "loading" pour l'auth
    // filter(user => user !== undefined), 
    take(1),
    map(user => {
      // 1. Si pas connecté -> Redirection Login
      if (!user) {
        // createUrlTree est mieux que navigate car il permet au routeur de gérer la redirection proprement
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      // 2. Si rôle spécifique requis (ex: ADMIN)
      if (requiredRoles && requiredRoles.length > 0) {
        // Vérifie si l'utilisateur a l'un des rôles requis
        // Note: user.role est une string (ex: 'CUSTOMER'), requiredRoles est ['ADMIN']
        if (!requiredRoles.includes(user.role)) {
          console.warn(`⛔ Accès refusé : Rôle '${user.role}' insuffisant. Requis : ${requiredRoles}`);
          return router.createUrlTree(['/']); // Redirection vers Accueil
        }
      }

      // 3. Tout est OK
      return true;
    })
  );
};
