import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../shared/models';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-order-detail.component.html',
})
export class AdminOrderDetailComponent implements OnInit {
  order!: Order;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(Number(id));
    }
  }

  loadOrder(id: number): void {
    this.orderService.getAdminOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Commande introuvable';
        this.isLoading = false;
      },
    });
  }

  formatPrice(price: number): string {
    return this.orderService.formatPrice(price);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status as any);
  }

  getStatusBadgeClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status as any);
  }

  getItemsTotal(): number {
    return this.order.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  getSubtotal(order: Order): number {
    if (order.discount) {
      return order.totalAmount + order.discount;
    }
    return order.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }
}
