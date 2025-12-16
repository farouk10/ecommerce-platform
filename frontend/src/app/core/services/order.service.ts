import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Order,
  OrderStatus,
  OrderStatusLabels,
  OrderStatusBadgeClasses,
} from '../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly ORDER_API = environment.orderServiceUrl;
  private readonly ADMIN_API = `${environment.adminServiceUrl}/orders`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les commandes de l'utilisateur
   */
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.ORDER_API}`);
  }

  /**
   * Récupérer une commande par son ID
   */
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.ORDER_API}/${id}`);
  }

  /**
   * Récupérer une commande par son ID (Admin)
   */
  getAdminOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.ADMIN_API}/${id}`);
  }

  /**
   * Annuler une commande
   */
  cancelOrder(id: number): Observable<Order> {
    return this.http.put<Order>(`${this.ORDER_API}/${id}/cancel`, {});
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

  /**
   * Obtenir le label du statut en français
   */
  getStatusLabel(status: OrderStatus): string {
    return OrderStatusLabels[status] || status;
  }

  /**
   * Obtenir la classe CSS du badge de statut
   */
  getStatusBadgeClass(status: OrderStatus): string {
    return OrderStatusBadgeClasses[status] || '';
  }
  /**
   * Récupérer les adresses de livraison sauvegardées
   */
  getSavedAddresses(): Observable<string[]> {
    return this.http.get<string[]>(`${this.ORDER_API}/saved-addresses`);
  }
}
