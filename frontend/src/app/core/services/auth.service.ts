import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../../shared/models/auth.model';
import { CartService } from './cart.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_API = environment.authServiceUrl;
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'current_user';

  // BehaviorSubject pour gérer l'état de l'utilisateur connecté
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private cartService: CartService) {
    // Initialiser avec les données du localStorage si disponibles
    const storedUser = this.getUserFromStorage();
    this.currentUserSubject.next(storedUser);
    this.isAuthenticatedSubject.next(!!storedUser && !!this.getAccessToken());
  }

  /**
   * Login
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.AUTH_API}/login`, credentials)
      .pipe(
        tap((response) => {
          this.saveAuthData(response);
          console.log('✅ Login réussi:', response.user);
        })
      );
  }

  /**
   * Register
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.AUTH_API}/register`, userData)
      .pipe(
        tap((response) => {
          this.saveAuthData(response);
          console.log('✅ Inscription réussie:', response.user);
        })
      );
  }

  /**
   * Logout
   */
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    // Optimistic Logout: Clear data immediately so UI updates instantly
    this.clearAuthData();
    this.cartService.resetCartState();
    console.log('✅ Local session cleared immediately (Optimistic Logout)');

    if (refreshToken) {
      // Fire and forget - backend revocation
      return this.http.post(`${this.AUTH_API}/logout`, { refreshToken }).pipe(
        catchError((err) => {
          console.warn('Backend logout failed/ignored', err);
          return of(null);
        })
      );
    } else {
      return of(null);
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Save auth data
   */
  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Get user from storage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Erreur parsing user data:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Refresh profile
   */
  refreshProfile(): Observable<User> {
    return this.http.get<User>(`${this.AUTH_API}/profile`).pipe(
      tap((user) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<AuthResponse>(`${this.AUTH_API}/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.saveAuthData(response);
          console.log('✅ Token refreshed successfully');
        }),
        catchError((error) => {
          console.error('❌ Token refresh failed:', error);
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  // Additional methods (profile, addresses, etc.)
  getUser(): Observable<User | null> {
    return this.currentUser$;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Update user profile
   */
  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.AUTH_API}/profile`, data).pipe(
      tap((user) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        console.log('✅ Profil mis à jour:', user);
      })
    );
  }

  // Address Management
  getAddresses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.AUTH_API}/addresses`);
  }

  addAddress(address: any): Observable<any> {
    return this.http.post<any>(`${this.AUTH_API}/addresses`, address);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.AUTH_API}/addresses/${id}`);
  }

  updateAddress(address: any): Observable<any> {
    return this.http.put<any>(
      `${this.AUTH_API}/addresses/${address.id}`,
      address
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.AUTH_API}/forgot-password`,
      { email }
    );
  }

  resetPassword(data: {
    token: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.AUTH_API}/reset-password`,
      data
    );
  }
}
