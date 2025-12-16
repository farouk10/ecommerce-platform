import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

// Interface alignée avec votre Backend (PromoCode.java)
interface PromoCode {
  code: string;
  description: string;
  discountPercent: number;
  minAmount?: number;
  maxDiscount?: number;
  expiresAt: string; // LocalDateTime string from backend
  active: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-promo-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header avec Stats -->
      <div
        class="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🎟️ Codes Promo
            <span
              class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full"
            >
              {{ promoCodes.length }}
            </span>
          </h1>
          <p class="text-gray-500 mt-2">Gérez vos campagnes de réduction</p>
        </div>
        <button
          (click)="openCreateForm()"
          class="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
        >
          <span>➕</span> Nouveau Code
        </button>
      </div>

      <!-- Formulaire de Création / Édition (Modale simplifiée inline) -->
      <div
        *ngIf="showForm"
        class="bg-white p-8 rounded-xl shadow-lg border-2 border-indigo-50 transform transition-all"
      >
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {{ editingCode ? '✏️ Modifier' : '✨ Créer' }} un Code Promo
          </h2>
          <button
            (click)="resetForm()"
            class="text-gray-400 hover:text-gray-600"
          >
            ❌
          </button>
        </div>

        <form
          [formGroup]="promoForm"
          (ngSubmit)="submitForm()"
          class="space-y-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Code -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Code Promo *</label
              >
              <div class="relative">
                <input
                  type="text"
                  formControlName="code"
                  [readonly]="!!editingCode"
                  class="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase tracking-wider font-bold"
                  placeholder="SUMMER2025"
                  [class.bg-gray-100]="!!editingCode"
                />
              </div>
              <p
                *ngIf="f['code'].invalid && f['code'].touched"
                class="text-red-500 text-xs mt-1"
              >
                Requis (3-20 caractères alphanumériques)
              </p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Description</label
              >
              <input
                type="text"
                formControlName="description"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Réduction spéciale été"
              />
            </div>

            <!-- Réduction % -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Réduction (%) *</label
              >
              <div class="relative">
                <input
                  type="number"
                  formControlName="discountPercent"
                  class="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="20"
                />
                <span class="absolute right-4 top-3 text-gray-400">%</span>
              </div>
            </div>

            <!-- Expiration -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Expire le *</label
              >
              <input
                type="datetime-local"
                formControlName="expiresAt"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <!-- Min Amount -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Montant Min. (MAD)</label
              >
              <input
                type="number"
                formControlName="minAmount"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>

            <!-- Max Discount -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Réduction Max. (MAD)</label
              >
              <input
                type="number"
                formControlName="maxDiscount"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Illimité"
              />
            </div>
          </div>

          <!-- Actif Toggle -->
          <div
            class="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <input
              type="checkbox"
              formControlName="active"
              id="active"
              class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label
              for="active"
              class="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Activer ce code promo immédiatement
            </label>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              (click)="resetForm()"
              class="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              [disabled]="promoForm.invalid || isSubmitting"
              class="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <span *ngIf="isSubmitting" class="animate-spin">⌛</span>
              {{ editingCode ? 'Mettre à jour' : 'Sauvegarder' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Table -->
      <div
        class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Code / Desc
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Réduction
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Conditions
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Validité
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Statut
                </th>
                <th
                  class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                *ngFor="let promo of promoCodes"
                class="hover:bg-gray-50 transition-colors"
              >
                <!-- Code & Desc -->
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span
                      class="text-sm font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit"
                    >
                      {{ promo.code }}
                    </span>
                    <span class="text-xs text-gray-500 mt-1">{{
                      promo.description || 'Pas de description'
                    }}</span>
                  </div>
                </td>

                <!-- Réduction -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-green-600">
                    -{{ promo.discountPercent }}%
                  </div>
                  <div *ngIf="promo.maxDiscount" class="text-xs text-gray-400">
                    Max: {{ promo.maxDiscount }} MAD
                  </div>
                </td>

                <!-- Conditions -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div
                    *ngIf="promo.minAmount && promo.minAmount > 0; else noCond"
                  >
                    Min:
                    <span class="font-semibold">{{ promo.minAmount }} MAD</span>
                  </div>
                  <ng-template #noCond>
                    <span class="text-gray-400 italic">Aucune</span>
                  </ng-template>
                </td>

                <!-- Validité -->
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div
                    [class.text-red-500]="isExpired(promo.expiresAt)"
                    class="text-gray-700"
                  >
                    {{ formatDate(promo.expiresAt) }}
                  </div>
                  <div
                    *ngIf="isExpired(promo.expiresAt)"
                    class="text-xs text-red-500 font-bold"
                  >
                    Expiré
                  </div>
                </td>

                <!-- Statut -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    [class]="
                      promo.active && !isExpired(promo.expiresAt)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    "
                    class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{
                      promo.active && !isExpired(promo.expiresAt)
                        ? 'Actif'
                        : 'Inactif'
                    }}
                  </span>
                </td>

                <!-- Actions -->
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <button
                    (click)="editPromo(promo)"
                    class="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    (click)="deletePromo(promo.code)"
                    class="text-red-600 hover:text-red-900 transition-colors"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div
            *ngIf="promoCodes.length === 0"
            class="text-center py-12 bg-gray-50"
          >
            <div class="text-6xl mb-4">🎫</div>
            <h3 class="text-lg font-medium text-gray-900">Aucun code promo</h3>
            <p class="text-gray-500 mt-2">
              Créez votre première campagne marketing !
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.3s ease-in;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class PromoAdminComponent implements OnInit {
  promoCodes: PromoCode[] = [];
  promoForm: FormGroup;
  showForm = false;
  editingCode: string | null = null;
  isSubmitting = false;

  // L'URL correcte vers CartService
  private readonly PROMO_API = `${environment.cartServiceUrl}/promo-codes`;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.promoForm = this.fb.group({
      code: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern('^[A-Z0-9]+$'),
        ],
      ],
      description: [''],
      discountPercent: [
        10,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      expiresAt: ['', Validators.required],
      minAmount: [0, Validators.min(0)],
      maxDiscount: [null, Validators.min(0)], // Optionnel
      active: [true],
    });
  }

  ngOnInit() {
    this.loadPromoCodes();
  }

  get f() {
    return this.promoForm.controls;
  }

  loadPromoCodes() {
    this.http.get<PromoCode[]>(this.PROMO_API).subscribe({
      next: (codes) => {
        // Trier par date de création (les plus récents en premier)
        // Note: Assurez-vous que le backend renvoie createdAt, sinon triez par expiresAt ou autre
        // Safe sort with null checks
        this.promoCodes = (codes || [])
          .filter((c) => c != null)
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
      },
      error: (error) => console.error('Erreur chargement codes:', error),
    });
  }

  openCreateForm() {
    this.resetForm();
    this.showForm = true;

    // Valeur par défaut : expire dans 1 mois
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.promoForm.patchValue({
      expiresAt: this.toDatetimeLocal(nextMonth.toISOString()),
    });
  }

  submitForm() {
    if (this.promoForm.invalid) {
      this.promoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.promoForm.getRawValue();

    // S'assurer que le code est en majuscule
    formValue.code = formValue.code.toUpperCase();

    if (this.editingCode) {
      // Update
      this.http
        .put(`${this.PROMO_API}/${this.editingCode}`, formValue)
        .subscribe({
          next: () => {
            this.loadPromoCodes();
            this.resetForm();
          },
          error: (err) => {
            alert(
              'Erreur modification: ' +
                (err.error?.message || 'Erreur inconnue')
            );
            this.isSubmitting = false;
          },
        });
    } else {
      // Create
      this.http.post(this.PROMO_API, formValue).subscribe({
        next: () => {
          this.loadPromoCodes();
          this.resetForm();
        },
        error: (err) => {
          alert(
            'Erreur création: ' + (err.error?.message || 'Code existant ?')
          );
          this.isSubmitting = false;
        },
      });
    }
  }

  editPromo(promo: PromoCode) {
    this.editingCode = promo.code;
    this.showForm = true;

    this.promoForm.patchValue({
      code: promo.code,
      description: promo.description,
      discountPercent: promo.discountPercent,
      minAmount: promo.minAmount,
      maxDiscount: promo.maxDiscount,
      active: promo.active,
      expiresAt: this.toDatetimeLocal(promo.expiresAt),
    });

    // Le code ne peut pas être modifié une fois créé (clé primaire)
    this.promoForm.get('code')?.disable();
  }

  deletePromo(code: string) {
    if (
      !confirm(
        `Voulez-vous vraiment supprimer le code PROMO "${code}" ?\nCette action est irréversible.`
      )
    )
      return;

    this.http.delete(`${this.PROMO_API}/${code}`).subscribe({
      next: () => {
        this.loadPromoCodes();
      },
      error: () => alert('Impossible de supprimer ce code.'),
    });
  }

  resetForm() {
    this.promoForm.reset({
      discountPercent: 10,
      active: true,
      minAmount: 0,
    });
    this.promoForm.get('code')?.enable();
    this.editingCode = null;
    this.showForm = false;
    this.isSubmitting = false;
  }

  // --- Helpers ---

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  toDatetimeLocal(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:mm
  }

  isExpired(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }
}
