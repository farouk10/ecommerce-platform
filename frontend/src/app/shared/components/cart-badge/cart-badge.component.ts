import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart-badge',
  imports: [CommonModule, RouterModule],
  standalone: true,
  template: `
    <div class="relative">
      <button
        routerLink="/checkout"
        class="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
        [class.text-primary-600]="cartCount > 0"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>

        <span
          *ngIf="cartCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-swing shadow-sm"
        >
          {{ cartCount }}
        </span>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class CartBadgeComponent {
  cartCount = 0;

  constructor(private cartService: CartService) {
    this.cartService.cartCount$.subscribe((count) => {
      this.cartCount = count;
    });
  }
}
