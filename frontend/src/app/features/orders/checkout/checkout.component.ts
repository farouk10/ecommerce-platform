import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartItem, PaymentMethod, Address } from '../../../shared/models';
import {
  NgxIntlTelInputModule,
  SearchCountryField,
  CountryISO,
  PhoneNumberFormat,
} from 'ngx-intl-tel-input';
import { COUNTRIES } from '../../../shared/data/countries';
import { environment } from '../../../../environments/environment';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentFormComponent } from '../payment/payment-form.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxIntlTelInputModule,
    PaymentFormComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [
    CountryISO.France,
    CountryISO.Morocco,
    CountryISO.UnitedStates,
  ];

  countries = COUNTRIES;

  cartItems: CartItem[] = [];
  shippingForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  savedAddresses: Address[] = [];
  selectedAddress: Address | null = null;

  promoCode = '';
  promoCodeApplied: string | null = null;
  discount = 0;

  currentStep: 'cart' | 'shipping' | 'payment' | 'confirmation' = 'cart';

  stripeClientSecret: string | null = null;
  currentOrderId: number | null = null;
  pendingAmount: number | null = null;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private paymentService: PaymentService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      street: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      country: ['France', Validators.required],
      phoneNumber: ['', [Validators.required]],
    });

    this.shippingForm.valueChanges.subscribe(() => {});
  }

  ngOnInit(): void {
    // Check for pending checkout state logic
    const pendingState = localStorage.getItem('checkout_pending');
    if (pendingState) {
      try {
        const state = JSON.parse(pendingState);
        this.currentOrderId = state.orderId;
        this.stripeClientSecret = state.clientSecret;
        this.pendingAmount = state.amount;
        this.currentStep = 'payment';
        return; // Skip normal cart loading
      } catch (e) {
        console.error('Error parsing pending state', e);
        localStorage.removeItem('checkout_pending');
      }
    }

    const mode = this.route.snapshot.queryParamMap.get('mode');

    if (mode === 'direct') {
      const directItem = this.cartService.getDirectBuyItem();
      if (directItem) {
        this.cartItems = [directItem];
        this.currentStep = 'shipping';
        this.promoCodeApplied = null;
        this.discount = 0;
      } else {
        this.router.navigate(['/products']);
      }
    } else {
      this.loadCart();
      this.route.queryParamMap.subscribe((params) => {
        if (params.get('step') === 'shipping' && this.cartItems.length > 0) {
          this.currentStep = 'shipping';
        }
      });
    }

    this.loadSavedAddresses();
  }

  loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        if (this.route.snapshot.queryParamMap.get('mode') !== 'direct') {
          this.cartItems = cart.items;
          this.promoCodeApplied = cart.promoCode;
          this.discount = cart.discount || 0;
        }
      },
      error: (error) => {
        console.error('Erreur chargement panier:', error);
        this.cartItems = [];
      },
    });
  }

  loadSavedAddresses(): void {
    this.authService.getAddresses().subscribe({
      next: (addresses) => {
        this.savedAddresses = addresses;
      },
      error: (err) => console.error('Error loading addresses', err),
    });
  }

  onAddressSelect(address: Address): void {
    this.selectedAddress = address;
    this.shippingForm.patchValue({
      fullName: address.fullName,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      phoneNumber: address.phoneNumber,
    });
  }

  getSubtotal(): number {
    if (this.route.snapshot.queryParamMap.get('mode') === 'direct') {
      return this.cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
    }
    return this.cartService.getSubtotal();
  }

  getShippingCost(): number {
    const subtotal = this.getSubtotal();
    return subtotal >= 50 ? 0 : 5.99;
  }

  getTotal(): number {
    if (this.route.snapshot.queryParamMap.get('mode') === 'direct') {
      const subtotal = this.getSubtotal();
      return subtotal + this.getShippingCost() - this.discount;
    }
    return this.cartService.getTotalAmount() + this.getShippingCost();
  }

  formatPrice(price: number): string {
    return this.cartService.formatPrice(price);
  }

  increaseQuantity(productId: number): void {
    const item = this.cartItems.find((i) => i.productId === productId);
    if (!item) return;

    this.cartService.updateQuantity(productId, item.quantity + 1).subscribe({
      next: () => this.loadCart(),
      error: (error) => console.error('Erreur:', error),
    });
  }

  decreaseQuantity(productId: number): void {
    const item = this.cartItems.find((i) => i.productId === productId);
    if (!item || item.quantity <= 1) return;

    this.cartService.updateQuantity(productId, item.quantity - 1).subscribe({
      next: () => this.loadCart(),
      error: (error) => console.error('Erreur:', error),
    });
  }

  removeItem(productId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce produit ?')) return;

    this.cartService.removeFromCart(productId).subscribe({
      next: () => this.loadCart(),
      error: (error) => console.error('Erreur:', error),
    });
  }

  applyPromoCode(): void {
    if (!this.promoCode.trim()) {
      alert('Veuillez entrer un code promo');
      return;
    }

    this.cartService.applyPromoCode(this.promoCode).subscribe({
      next: (cart) => {
        this.promoCodeApplied = cart.promoCode;
        this.discount = cart.discount || 0;
        alert(`Code promo "${this.promoCode}" appliqué !`);
        this.loadCart();
      },
      error: (error) => {
        console.error('Erreur promo:', error);
        const msg = error.error?.error || 'Code promo invalide ou expiré';
        alert('Erreur: ' + msg);
      },
    });
  }

  removePromoCodeApplied(): void {
    this.cartService.removePromoCode().subscribe({
      next: () => {
        this.promoCodeApplied = null;
        this.discount = 0;
        this.promoCode = '';
        this.loadCart();
      },
      error: (error) => console.error('Erreur:', error),
    });
  }

  proceedToShipping(): void {
    if (this.cartItems.length === 0) {
      alert('Votre panier est vide');
      return;
    }
    this.currentStep = 'shipping';
  }

  backToCart(): void {
    this.currentStep = 'cart';
  }

  submitOrder(): void {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const v = this.shippingForm.value;

    let phoneNumber = v.phoneNumber;
    if (phoneNumber && typeof phoneNumber === 'object') {
      phoneNumber = phoneNumber.e164Number;
    }

    if (!this.selectedAddress) {
      const newAddress: Address = {
        fullName: v.fullName,
        street: v.street,
        city: v.city,
        postalCode: v.postalCode,
        country: v.country,
        phoneNumber: phoneNumber,
      };
      this.authService.addAddress(newAddress).subscribe();
    }

    const shippingAddress = `${v.street}, ${v.postalCode} ${v.city}, ${v.country} - Tel: ${phoneNumber}`;

    const checkoutObs =
      this.route.snapshot.queryParamMap.get('mode') === 'direct'
        ? this.cartService.checkoutDirect(
            shippingAddress,
            this.cartItems[0].productId,
            this.cartItems[0].quantity,
            PaymentMethod.CREDIT_CARD
          )
        : this.cartService.checkout(shippingAddress, PaymentMethod.CREDIT_CARD);

    checkoutObs.subscribe({
      next: (response) => {
        console.log('Order Created (Pending Payment):', response);
        this.currentOrderId = response.order.id;
        this.initiatePaymentFlow(this.currentOrderId!);
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.isSubmitting = false;
        this.errorMessage =
          'Impossible de créer la commande. Veuillez réessayer.';
      },
    });
  }

  initiatePaymentFlow(orderId: number): void {
    this.currentStep = 'payment';
    this.isSubmitting = false;

    const amount = this.getTotal();

    this.paymentService.initiatePayment(orderId, amount, 'eur').subscribe({
      next: (res) => {
        console.log('Stripe Intent Created:', res);
        this.stripeClientSecret = res.clientSecret;

        // Persist state for refresh recovery
        localStorage.setItem(
          'checkout_pending',
          JSON.stringify({
            orderId: orderId,
            clientSecret: res.clientSecret,
            amount: amount,
          })
        );
      },
      error: (err) => {
        console.error('Payment Init Error:', err);
        this.errorMessage = 'Erreur initialisation paiement.';
        this.currentStep = 'shipping';
      },
    });
  }

  onPaymentSuccess(): void {
    const finalize = () => {
      this.currentStep = 'confirmation';
      this.cartService.clearCart();
      localStorage.removeItem('checkout_pending');
    };

    if (this.currentOrderId) {
      // Trigger manual verification to ensure backend status updates (useful if webhooks fail)
      this.paymentService.verifyPayment(this.currentOrderId).subscribe({
        next: (success) => {
          console.log('Backend verification result:', success);
          finalize();
        },
        error: (err) => {
          console.warn('Backend verification failed, relying on webhook:', err);
          finalize();
        },
      });
    } else {
      finalize();
    }
  }

  isStepComplete(step: string): boolean {
    const steps = ['cart', 'shipping', 'payment', 'confirmation'];
    return steps.indexOf(step) < steps.indexOf(this.currentStep);
  }

  get fullName() {
    return this.shippingForm.get('fullName');
  }
  get street() {
    return this.shippingForm.get('street');
  }
  get city() {
    return this.shippingForm.get('city');
  }
  get postalCode() {
    return this.shippingForm.get('postalCode');
  }
  get country() {
    return this.shippingForm.get('country');
  }
  get phoneNumber() {
    return this.shippingForm.get('phoneNumber');
  }

  formatAddress(address: Address): string {
    return `${address.fullName} - ${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
  }
}
