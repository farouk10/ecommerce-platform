import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../shared/models';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css',
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
    // Si discount existe, le sous-total est Total + Discount
    // Sinon c'est juste la somme des items
    if (order.discount) {
      return order.totalAmount + order.discount;
    }
    return order.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }

  // --- Timeline Logic ---
  get timelineEvents() {
    if (!this.order) return [];

    // Explicit type to handle Date vs string vs null
    const events: {
      title: string;
      desc: string;
      date: Date | string | null;
      icon: string;
      done: boolean;
    }[] = [
      {
        title: 'Commande passée',
        desc: `Commande #${this.order.orderNumber || this.order.id} créée.`,
        date: this.order.createdAt,
        icon: '📝',
        done: true,
      },
    ];

    const status = this.order.status;

    // Define Order of Operation
    const flow = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // Helper to check if we passed a stage
    const isPassed = (s: OrderStatus) => {
      if (status === OrderStatus.CANCELLED) return false;
      const currentIndex = flow.indexOf(status);
      const targetIndex = flow.indexOf(s);
      return currentIndex >= targetIndex;
    };

    // Helper to get date for a specific stage
    const getDateForStage = (s: OrderStatus) => {
      if (s === status) return this.order.updatedAt;
      return null;
    };

    if (isPassed(OrderStatus.CONFIRMED)) {
      events.push({
        title: 'Paiement confirmé',
        desc: `Paiement sécurisé via ${this.order.paymentMethod || 'Carte'}.`,
        date: getDateForStage(OrderStatus.CONFIRMED),
        icon: '💳',
        done: true,
      });
    }

    if (isPassed(OrderStatus.PROCESSING)) {
      events.push({
        title: 'En cours de préparation',
        desc: "Les articles sont en cours d'emballage.",
        date: getDateForStage(OrderStatus.PROCESSING),
        icon: '📦',
        done: true,
      });
    }

    if (isPassed(OrderStatus.SHIPPED)) {
      events.push({
        title: 'Expédié',
        desc: 'Remis au transporteur.',
        date: getDateForStage(OrderStatus.SHIPPED),
        icon: '🚚',
        done: true,
      });
    }

    if (isPassed(OrderStatus.DELIVERED)) {
      events.push({
        title: 'Livré',
        desc: 'Colis livré.',
        date: getDateForStage(OrderStatus.DELIVERED),
        icon: '✅',
        done: true,
      });
    }

    // Future Steps
    if (status === OrderStatus.PENDING) {
      events.push({
        title: 'Confirmation requise',
        desc: 'En attente de transaction.',
        date: null,
        icon: '⏳',
        done: false,
      });
    } else if (status === OrderStatus.PROCESSING) {
      events.push({
        title: "En attente d'expédition",
        desc: 'Prêt à partir.',
        date: null,
        icon: '⏳',
        done: false,
      });
    } else if (status === OrderStatus.SHIPPED) {
      events.push({
        title: 'En transit',
        desc: 'Arrive bientôt.',
        date: null,
        icon: '🚚',
        done: false,
      });
    }

    return events.reverse();
  }
}
