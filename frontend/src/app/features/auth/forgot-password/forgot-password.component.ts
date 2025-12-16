import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Mot de passe oublié ?
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Entrez votre email et nous vous enverrons un lien de
            réinitialisation.
          </p>
        </div>

        <form
          [formGroup]="forgotForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <div
            *ngIf="successMessage"
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          >
            {{ successMessage }}
          </div>
          <div
            *ngIf="errorMessage"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          >
            {{ errorMessage }}
          </div>

          <div>
            <label for="email" class="sr-only">Adresse email</label>
            <input
              id="email"
              formControlName="email"
              type="email"
              required
              class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Adresse email"
            />
          </div>

          <div>
            <button
              type="submit"
              [disabled]="forgotForm.invalid || isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {{ isLoading ? 'Envoi...' : 'Envoyer le lien' }}
            </button>
          </div>

          <div class="text-sm text-center">
            <a
              routerLink="/login"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Retour à la connexion
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
        next: (res) => {
          this.successMessage = res.message;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Une erreur est survenue.';
          this.isLoading = false;
        },
      });
    }
  }
}
