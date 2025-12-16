import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product!: Product;
  quantity: number = 1;
  isLoading: boolean = true;
  errorMessage: string = '';
  selectedImage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(Number(id));
    }
  }

  loadProduct(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.selectedImage = product.images?.[0] || product.imageUrl || null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Produit introuvable';
        this.isLoading = false;
      },
    });
  }

  addToCart(): void {
    this.cartService
      .addToCart(
        this.product.id,
        this.product.name,
        this.product.price,
        this.quantity,
        this.product.images ||
          (this.product.imageUrl ? [this.product.imageUrl] : [])
      )
      .subscribe({
        next: () => {
          // Utilisation de Toast ou notification plus subtile idéale ici
          alert(`✅ ${this.product.name} ajouté au panier !`);
        },
        error: (error) => {
          console.error('Erreur ajout panier:', error);
          alert("❌ Erreur lors de l'ajout au panier");
        },
      });
  }

  buyNow(): void {
    // 1. Créer l'item temporaire
    const directItem = {
      productId: this.product.id,
      productName: this.product.name,
      price: this.product.price,
      quantity: this.quantity,
      imageUrl: this.product.images?.[0] || this.product.imageUrl || '',
      images: this.product.images || [],
    };

    // 2. Le stocker dans le service (SANS l'ajouter au panier backend)
    this.cartService.setDirectBuyItem(directItem);

    // 3. Rediriger vers checkout en mode direct
    this.router.navigate(['/checkout'], {
      queryParams: { mode: 'direct', step: 'shipping' },
    });
  }

  increaseQuantity(): void {
    if (this.quantity < this.product.stockQuantity) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }
}
