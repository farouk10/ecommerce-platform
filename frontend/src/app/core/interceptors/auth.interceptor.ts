import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import {
  catchError,
  throwError,
  BehaviorSubject,
  filter,
  take,
  switchMap,
  tap,
} from 'rxjs';
import { Router } from '@angular/router';

// Variables pour gérer le rafraîchissement concurrent
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<
  string | null
>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  // Exclure les requêtes d'auth (login/register/refresh) pour éviter les boucles
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    return next(req);
  }

  // Clone request to add Authorization header if token exists
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Si c'est déjà une tentative de refresh qui a échoué -> Logout
        if (req.url.includes('/refresh')) {
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((tokenResponse) => {
              isRefreshing = false;
              refreshTokenSubject.next(tokenResponse.accessToken);

              // Rejouer la requête initiale avec le nouveau token
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${tokenResponse.accessToken}`,
                  },
                })
              );
            }),
            catchError((err) => {
              isRefreshing = false;
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        } else {
          // Si un refresh est déjà en cours, on attend qu'il se termine
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((jwt) => {
              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${jwt}` },
                })
              );
            })
          );
        }
      }

      // 403 Forbidden : Accès interdit (Rôle insuffisant)
      if (error instanceof HttpErrorResponse && error.status === 403) {
        router.navigate(['/']);
      }

      return throwError(() => error);
    })
  );
};
