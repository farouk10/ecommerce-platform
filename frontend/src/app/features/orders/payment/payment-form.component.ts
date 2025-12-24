import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StripeService } from 'ngx-stripe';
import {
  StripeElements,
  StripePaymentElement,
  StripePaymentElementOptions,
} from '@stripe/stripe-js';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-6">
      <div *ngIf="isLoading" class="text-center py-4 text-slate-500">
        Connexion à Stripe...
      </div>

      <!-- Manual Mount Point -->
      <div
        #paymentElementDiv
        class="min-h-[200px]"
        [class.hidden]="isLoading"
      ></div>

      <div
        *ngIf="errorMessage"
        class="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm"
      >
        {{ errorMessage }}
      </div>

      <div class="mt-6">
        <button
          (click)="pay()"
          [disabled]="isSubmitting || isLoading"
          class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span *ngIf="isSubmitting" class="mr-2">
            <svg
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
          {{
            isSubmitting
              ? 'Paiement en cours...'
              : 'Payer ' + (amount | currency : 'EUR')
          }}
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class PaymentFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) clientSecret!: string;
  @Input({ required: true }) amount!: number;
  @Input({ required: true }) orderId!: number;
  @Input() returnUrl!: string;

  @Output() paymentSuccess = new EventEmitter<void>();

  @ViewChild('paymentElementDiv') paymentElementRef!: ElementRef;

  elements: StripeElements | undefined;
  paymentElement: StripePaymentElement | undefined;

  isSubmitting = false;
  isLoading = true;
  errorMessage = '';

  private stripeService = inject(StripeService);
  private cd = inject(ChangeDetectorRef);

  ngOnInit() {}

  ngAfterViewInit() {
    this.initializeStripe();
  }

  ngOnDestroy() {
    if (this.paymentElement) {
      this.paymentElement.destroy();
    }
  }

  initializeStripe() {
    if (!this.clientSecret) {
      console.error('Missing clientSecret');
      return;
    }

    this.stripeService
      .elements({
        clientSecret: this.clientSecret,
        locale: 'fr',
        appearance: {
          theme: 'stripe',
        },
      })
      .subscribe((elements) => {
        this.elements = elements;

        this.paymentElement = this.elements.create('payment', {
          layout: 'tabs',
        });

        this.paymentElement.mount(this.paymentElementRef.nativeElement);

        this.paymentElement.on('ready', () => {
          this.isLoading = false;
          this.cd.detectChanges();
        });

        this.paymentElement.on('loaderror', (event) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur de chargement Stripe';
          console.error('Load Error', event);
          this.cd.detectChanges();
        });
      });
  }

  pay() {
    if (this.isSubmitting) return;

    if (!this.elements) {
      this.errorMessage = "Stripe n'est pas initialisé.";
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.stripeService
      .confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url:
            this.returnUrl ||
            window.location.origin + '/orders/' + this.orderId,
        },
        redirect: 'if_required',
      })
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          if (result.error) {
            this.errorMessage =
              result.error.message ||
              'Une erreur est survenue lors du paiement.';
            this.cd.detectChanges();
          } else if (
            result.paymentIntent.status === 'succeeded' ||
            result.paymentIntent.status === 'processing'
          ) {
            this.paymentSuccess.emit();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = 'Erreur technique lors du paiement.';
          console.error('Payment error:', err);
          this.cd.detectChanges();
        },
      });
  }
}
