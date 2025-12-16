/**src/app/shared/models/cart.model.ts
 * Panier complet (backend response)
 */
export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  promoCode: string | null;
  discount: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Item dans le panier
 */
export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  images?: string[];

}

/**
 * Requête pour ajouter au panier
 */
export interface AddToCartRequest {
  productId: number;
  quantity: number;
  productName?: string;  // ✅ AJOUTER
  price?: number;        // ✅ AJOUTER
  imageUrl?: string;     // ✅ OPTIONNEL
  images?: string[];      // ✅ OPTIONNEL

}

/**
 * Requête pour mettre à jour la quantité
 */
export interface UpdateCartItemRequest {
  productId: number;
  quantity: number;
}

/**
 * Requête pour appliquer un code promo
 */
export interface ApplyPromoCodeRequest {
  promoCode: string;
}

/**
 * Requête pour le checkout
 */
export interface CheckoutRequest {
  shippingAddress: string;
  paymentMethod: PaymentMethod;
}

/**
 * Réponse du checkout
 */
export interface CheckoutResponse {
  success: boolean;
  message: string;
  order: OrderSummary;
}

/**
 * Résumé de commande après checkout
 */
export interface OrderSummary {
  id: number;
  userId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: OrderItemSummary[];
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
}

/**
 * Item de commande (résumé)
 */
export interface OrderItemSummary {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

/**
 * Méthodes de paiement
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER'
}
