import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  standalone: true,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() productAdded = new EventEmitter<Product>();

  isAddingToCart = false;

  constructor(private cartService: CartService) {}

  /**
   * Ajouter au panier
   */
  addToCart(): void {
    if (this.product.stockQuantity === 0) return;

    this.isAddingToCart = true;

    // ✅ CORRECTION : passe name + price
    this.cartService
      .addToCart(
        this.product.id,
        this.product.name,
        this.product.price,
        1,
        this.product.images ||
          (this.product.imageUrl ? [this.product.imageUrl] : [])
      )
      .subscribe({
        next: () => {
          this.isAddingToCart = false;
          this.productAdded.emit(this.product);
          console.log('✅', this.product.name, 'ajouté au panier !');
        },
        error: (error) => {
          this.isAddingToCart = false;
          console.error('❌ Erreur ajout panier:', error);
        },
      });
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
   * Vérifier si le produit est en stock
   */
  isInStock(): boolean {
    return this.product.stockQuantity > 0;
  }

  /**
   * Obtenir le badge de stock
   */
  getStockBadge(): string {
    if (this.product.stockQuantity === 0) return 'Rupture de stock';
    if (this.product.stockQuantity < 5) return 'Stock limité';
    return `${this.product.stockQuantity} en stock`;
  }

  /**
   * Obtenir la classe CSS pour le badge de stock
   */
  getStockBadgeClass(): string {
    if (this.product.stockQuantity === 0)
      return 'bg-red-100 text-red-800 border border-red-200';
    if (this.product.stockQuantity < 5)
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    return 'bg-green-100 text-green-800 border border-green-200';
  }
}
