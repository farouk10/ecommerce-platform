import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
  ApplyPromoCodeRequest,
  CheckoutRequest,
  CheckoutResponse,
  PaymentMethod,
} from '../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly CART_API = environment.cartServiceUrl;

  // BehaviorSubject pour le panier
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  // BehaviorSubject pour le nombre d'items
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Charger le panier seulement si l'utilisateur est authentifié
    if (this.isUserAuthenticated()) {
      this.loadCart();
    }
  }

  /**
   * Vérifier si l'utilisateur est authentifié (via localStorage)
   */
  private isUserAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Charger le panier depuis le backend
   */
  loadCart(): void {
    // Ne charger que si authentifié
    if (!this.isUserAuthenticated()) {
      return;
    }

    this.http
      .get<Cart>(`${this.CART_API}`)
      .pipe(
        catchError((error) => {
          // Ignorer silencieusement les erreurs 401 (non authentifié)
          if (error.status !== 401) {
            console.error('Erreur chargement panier:', error);
          }
          return of(null);
        })
      )
      .subscribe((cart) => {
        this.updateCartState(cart);
      });
  }

  /**
   * Obtenir le panier actuel
   */
  getCart(): Observable<Cart> {
    return this.http
      .get<Cart>(`${this.CART_API}`)
      .pipe(tap((cart) => this.updateCartState(cart)));
  }

  /**
   * Ajouter un produit au panier
   */
  addToCart(
    productId: number,
    productName: string,
    price: number,
    quantity: number = 1,
    images: string[] = []
  ): Observable<Cart> {
    const request: AddToCartRequest = {
      productId,
      productName, // ✅
      price, // ✅
      quantity,
      images,
    };

    return this.http.post<Cart>(`${this.CART_API}/items`, request).pipe(
      tap((cart) => {
        this.updateCartState(cart);
        console.log('✅ Produit ajouté au panier:', cart);
      }),
      catchError((error) => {
        console.error('❌ Erreur ajout au panier:', error);
        throw error;
      })
    );
  }

  /**
   * Mettre à jour la quantité d'un produit
   */
  updateQuantity(productId: number, quantity: number): Observable<Cart> {
    const request: UpdateCartItemRequest = { productId, quantity };

    return this.http
      .put<Cart>(`${this.CART_API}/items/${productId}`, request)
      .pipe(
        tap((cart) => {
          this.updateCartState(cart);
          console.log('✅ Quantité mise à jour:', cart);
        }),
        catchError((error) => {
          console.error('❌ Erreur mise à jour quantité:', error);
          throw error;
        })
      );
  }

  /**
   * Retirer un produit du panier
   */
  removeFromCart(productId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.CART_API}/items/${productId}`).pipe(
      tap((cart) => {
        this.updateCartState(cart);
        console.log('✅ Produit retiré du panier:', cart);
      }),
      catchError((error) => {
        console.error('❌ Erreur suppression produit:', error);
        throw error;
      })
    );
  }

  /**
   * Vider le panier
   */
  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.CART_API}/clear`).pipe(
      tap(() => {
        this.updateCartState(null);
        console.log('✅ Panier vidé');
      }),
      catchError((error) => {
        console.error('❌ Erreur vidage panier:', error);
        throw error;
      })
    );
  }

  /**
   * Appliquer un code promo
   */
  applyPromoCode(promoCode: string): Observable<Cart> {
    const request: ApplyPromoCodeRequest = { promoCode };

    return this.http.post<Cart>(`${this.CART_API}/promo`, request).pipe(
      tap((cart) => {
        this.updateCartState(cart);
        console.log('✅ Code promo appliqué:', cart);
      }),
      catchError((error) => {
        console.error('❌ Erreur code promo:', error);
        throw error;
      })
    );
  }

  /**
   * Retirer le code promo
   */
  removePromoCode(): Observable<Cart> {
    return this.http.delete<Cart>(`${this.CART_API}/promo`).pipe(
      tap((cart) => {
        this.updateCartState(cart);
        console.log('✅ Code promo retiré:', cart);
      }),
      catchError((error) => {
        console.error('❌ Erreur suppression promo:', error);
        throw error;
      })
    );
  }

  /**
   * Effectuer le checkout
   */
  checkout(
    shippingAddress: string,
    paymentMethod: PaymentMethod = PaymentMethod.CREDIT_CARD
  ): Observable<CheckoutResponse> {
    const request: CheckoutRequest = { shippingAddress, paymentMethod };

    return this.http
      .post<CheckoutResponse>(`${this.CART_API}/checkout`, request)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.updateCartState(null); // Vider le panier local
            console.log('✅ Checkout réussi:', response);
          }
        }),
        catchError((error) => {
          console.error('❌ Erreur checkout:', error);
          throw error;
        })
      );
  }

  /**
   * Obtenir le panier actuel (valeur synchrone)
   */
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  /**
   * Obtenir le nombre d'items dans le panier
   */
  getCartCount(): number {
    return this.cartCountSubject.value;
  }

  /**
   * Calculer le sous-total
   */
  getSubtotal(): number {
    const cart = this.cartSubject.value;
    return cart?.subtotal || 0;
  }

  /**
   * Obtenir le total avec réduction
   */
  getTotalAmount(): number {
    const cart = this.cartSubject.value;
    return cart?.totalAmount || 0;
  }

  /**
   * Obtenir la réduction appliquée
   */
  getDiscount(): number {
    const cart = this.cartSubject.value;
    return cart?.discount || 0;
  }

  /**
   * Obtenir le code promo appliqué
   */
  getPromoCode(): string | null {
    const cart = this.cartSubject.value;
    return cart?.promoCode || null;
  }

  /**
   * Mettre à jour l'état du panier
   */
  private updateCartState(cart: Cart | null): void {
    this.cartSubject.next(cart);

    const itemCount =
      cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
    this.cartCountSubject.next(itemCount);
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
    }).format(price);
  }

  // --- GESTION ACHAT IMMÉDIAT (DIRECT CHECKOUT) ---

  private directBuyItemSubject = new BehaviorSubject<CartItem | null>(null);
  public directBuyItem$ = this.directBuyItemSubject.asObservable();

  setDirectBuyItem(item: CartItem): void {
    console.log('⚡ Setting Direct Buy Item:', item);
    this.directBuyItemSubject.next(item);
  }

  getDirectBuyItem(): CartItem | null {
    return this.directBuyItemSubject.value;
  }

  clearDirectBuyItem(): void {
    this.directBuyItemSubject.next(null);
  }

  checkoutDirect(
    shippingAddress: string,
    productId: number,
    quantity: number,
    paymentMethod: PaymentMethod = PaymentMethod.CREDIT_CARD
  ): Observable<CheckoutResponse> {
    const request = {
      shippingAddress,
      paymentMethod,
      productId,
      quantity,
    };

    return this.http
      .post<CheckoutResponse>(`${this.CART_API}/checkout/direct`, request)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.clearDirectBuyItem(); // Vider l'item temporaire
            console.log('✅ Direct Checkout réussi:', response);
          }
        }),
        catchError((error) => {
          console.error('❌ Erreur direct checkout:', error);
          throw error;
        })
      );
  }
  /**
   * Réinitialiser l'état local du panier (pour le logout)
   */
  resetCartState(): void {
    this.updateCartState(null);
    this.clearDirectBuyItem();
    console.log('✅ État local du panier réinitialisé');
  }
}
