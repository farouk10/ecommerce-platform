import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
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
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Commande introuvable';
        this.isLoading = false;
      }
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
    return this.order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  getSubtotal(order: Order): number {
    // Si discount existe, le sous-total est Total + Discount
    // Sinon c'est juste la somme des items
    if (order.discount) {
      return order.totalAmount + order.discount;
    }
    return order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

}
