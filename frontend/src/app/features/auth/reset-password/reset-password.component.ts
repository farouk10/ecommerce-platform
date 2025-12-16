import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Réinitialiser le mot de passe
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Entrez votre nouveau mot de passe.
          </p>
        </div>

        <div
          *ngIf="!token"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        >
          Token invalide ou manquant.
        </div>

        <form
          *ngIf="token"
          [formGroup]="resetForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <div
            *ngIf="errorMessage"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          >
            {{ errorMessage }}
          </div>
          <div
            *ngIf="successMessage"
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          >
            {{ successMessage }}
            <p class="mt-2">
              <a routerLink="/login" class="underline font-bold"
                >Se connecter</a
              >
            </p>
          </div>

          <div *ngIf="!successMessage">
            <div>
              <label for="password" class="sr-only">Nouveau mot de passe</label>
              <input
                id="password"
                formControlName="password"
                type="password"
                required
                class="appearance-none rounded-t-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nouveau mot de passe"
              />
            </div>
            <div>
              <label for="confirmPassword" class="sr-only"
                >Confirmer le mot de passe</label
              >
              <input
                id="confirmPassword"
                formControlName="confirmPassword"
                type="password"
                required
                class="appearance-none rounded-b-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmer le mot de passe"
              />
            </div>

            <div
              *ngIf="resetForm.errors?.['mismatch']"
              class="text-red-500 text-xs mt-1"
            >
              Les mots de passe ne correspondent pas.
            </div>

            <div class="mt-4">
              <button
                type="submit"
                [disabled]="resetForm.invalid || isLoading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {{ isLoading ? 'Enregistrement...' : 'Réinitialiser' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token: string | null = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.valid && this.token) {
      this.isLoading = true;
      const newPassword = this.resetForm.get('password')?.value;

      this.authService
        .resetPassword({ token: this.token, newPassword })
        .subscribe({
          next: (res) => {
            this.successMessage = res.message;
            this.isLoading = false;
            // Redirect handled by user clicking link, or timeout
          },
          error: (err) => {
            this.errorMessage =
              err.error?.error || 'Erreur lors de la réinitialisation.';
            this.isLoading = false;
          },
        });
    }
  }
}
