/**src/app/shared/models/order.model.ts
 * Commande complète
 */
export interface Order {
  id: number;
  userId: string;
  // Client Info (Enriched for Admin)
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;

  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  promoCode: string | null;
  discount: number | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Item de commande
 */
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

/**
 * Statut de commande
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Labels des statuts en français
 */
export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.CONFIRMED]: 'Confirmée',
  [OrderStatus.PROCESSING]: 'En préparation',
  [OrderStatus.SHIPPED]: 'Expédiée',
  [OrderStatus.DELIVERED]: 'Livrée',
  [OrderStatus.CANCELLED]: 'Annulée',
};

/**
 * Classes CSS pour les badges de statut
 */
export const OrderStatusBadgeClasses: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.PROCESSING]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800 border-purple-200',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
};
