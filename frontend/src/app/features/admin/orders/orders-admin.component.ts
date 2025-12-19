import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  Order,
  OrderStatus,
  OrderStatusLabels,
  OrderStatusBadgeClasses,
} from '../../../shared/models';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-admin.component.html',
})
export class OrdersAdminComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  statusFilter = '';
  searchTerm = ''; // New search term

  // CORRECTION : Utilisation de l'URL admin/orders et non orders/admin/orders
  // Assurez-vous que environment.orderServiceUrl pointe vers http://localhost:8083/api
  // Fix: Use orderServiceUrl (/api/orders)
  private readonly ORDERS_API = `${environment.orderServiceUrl}`;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    // Fix: Call /all for admin view
    this.http.get<Order[]>(`${this.ORDERS_API}/all`).subscribe({
      next: (orders) => {
        // Sort by date desc (newest first) by default
        this.orders = orders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.filterOrders(); // Apply filters immediately
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement commandes:', error);
        this.isLoading = false;
      },
    });
  }

  filterOrders() {
    let result = this.orders;

    // 1. Status Filter
    if (this.statusFilter && this.statusFilter !== '') {
      result = result.filter((o) => o.status === this.statusFilter);
    }

    // 2. Search Filter (Order Number or User ID)
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(term) ||
          o.userId.toLowerCase().includes(term) ||
          o.id.toString().includes(term)
      );
    }

    this.filteredOrders = result;
  }

  updateStatus(orderId: number, newStatus: string) {
    if (!confirm(`Confirmer le changement de statut vers "${newStatus}" ?`))
      return;

    // Fix: Use PATCH and correct URL /api/orders/{id}/status
    // Note: Backend expects @RequestParam status, not body? Let's check Controller.
    // Controller: @RequestParam String status.
    // So we must pass query param, NOT body.
    this.http
      .patch(`${this.ORDERS_API}/${orderId}/status?status=${newStatus}`, {})
      .subscribe({
        next: () => {
          alert('✅ Statut mis à jour !');
          this.loadOrders();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors de la mise à jour');
        },
      });
  }

  viewDetails(orderId: number) {
    this.router.navigate(['/admin/orders', orderId]);
  }

  getStatusLabel(status: string): string {
    return OrderStatusLabels[status as OrderStatus] || status;
  }

  getStatusBadgeClass(status: string): string {
    return OrderStatusBadgeClasses[status as OrderStatus] || '';
  }

  getCountByStatus(status: string): number {
    return this.orders.filter((o) => o.status === status).length;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
