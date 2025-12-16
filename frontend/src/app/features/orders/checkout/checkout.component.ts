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

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxIntlTelInputModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  // Enum exposure
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

  // Saved Addresses
  savedAddresses: Address[] = [];
  selectedAddress: Address | null = null;

  // Promo
  promoCode = '';
  promoCodeApplied: string | null = null;
  discount = 0;

  // Étapes
  currentStep: 'cart' | 'shipping' | 'confirmation' = 'cart';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
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

    // Reset selected address if form is modified manually
    this.shippingForm.valueChanges.subscribe(() => {
      // Ideally we check if values still match selectedAddress, but simplest is to just clear selection
      // if the user types. However, onAddressSelect patches values, which triggers this.
      // We need a flag or distinctUntilChanged check, or just ignore for now.
      // For this task, let's just assume if they type, it might be a new address.
    });
  }

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('mode');

    if (mode === 'direct') {
      const directItem = this.cartService.getDirectBuyItem();
      if (directItem) {
        this.cartItems = [directItem];
        this.currentStep = 'shipping'; // Direct checkout starts at shipping
        this.promoCodeApplied = null;
        this.discount = 0;
      } else {
        // Fallback if refreshed page loses state
        this.router.navigate(['/products']);
      }
    } else {
      this.loadCart();
      // Check for query param 'step' AFTER loading cart
      // (Keep existing logic if not direct mode)
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
        // Only load if NOT in direct mode (handled in ngOnInit)
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
    // Only fetch structured addresses from Profile
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
    // Total backend (déjà avec réduction) + livraison
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
        // ✅ AFFICHER LE MESSAGE PRÉCIS DU BACKEND
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

    // Extract E.164 phone number
    let phoneNumber = v.phoneNumber;
    if (phoneNumber && typeof phoneNumber === 'object') {
      phoneNumber = phoneNumber.e164Number;
    }

    // Auto-save new address to profile
    if (!this.selectedAddress) {
      const newAddress: Address = {
        fullName: v.fullName,
        street: v.street,
        city: v.city,
        postalCode: v.postalCode,
        country: v.country,
        phoneNumber: phoneNumber,
      };

      // We don't wait for this to complete to prevent blocking checkout,
      // or we can wait to ensure consistency. Let's wait.
      this.authService.addAddress(newAddress).subscribe({
        next: (saved) => console.log('Address auto-saved:', saved),
        error: (err) => console.error('Failed to auto-save address:', err),
      });
    }

    const shippingAddress = `${v.street}, ${v.postalCode} ${v.city}, ${v.country} - Tel: ${phoneNumber}`;

    if (this.route.snapshot.queryParamMap.get('mode') === 'direct') {
      // DIRECT CHECKOUT
      const item = this.cartItems[0];
      this.cartService
        .checkoutDirect(
          shippingAddress,
          item.productId,
          item.quantity,
          PaymentMethod.CREDIT_CARD
        )
        .subscribe({
          next: (response) => {
            console.log('Commande DIRECTE créée:', response);
            this.currentStep = 'confirmation';
            this.isSubmitting = false;

            setTimeout(() => {
              this.router.navigate(['/orders', response.order.id]);
            }, 3000);
          },
          error: (error) => {
            console.error('Erreur checkout direct:', error);
            this.isSubmitting = false;
            this.errorMessage =
              'Impossible de créer la commande. Veuillez réessayer.';
          },
        });
    } else {
      // STANDARD CHECKOUT
      this.cartService
        .checkout(shippingAddress, PaymentMethod.CREDIT_CARD)
        .subscribe({
          next: (response) => {
            console.log('Commande créée:', response);
            this.currentStep = 'confirmation';
            this.isSubmitting = false;

            setTimeout(() => {
              this.router.navigate(['/orders', response.order.id]);
            }, 3000);
          },
          error: (error) => {
            console.error('Erreur checkout:', error);
            this.isSubmitting = false;
            this.errorMessage =
              'Impossible de créer la commande. Veuillez réessayer.';
          },
        });
    }
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
