import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service'; // Import ProductService
import { ProductCardComponent } from '../products/product-card/product-card.component';
import { ProductPage } from '../../shared/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;

  // Catégories de produits
  categories = [
    {
      name: 'Électronique',
      icon: '💻',
      description: 'Derniers gadgets et technologies',
      link: '/products?category=electronics',
    },
    {
      name: 'Mode',
      icon: '👔',
      description: 'Vêtements et accessoires tendance',
      link: '/products?category=fashion',
    },
    {
      name: 'Maison',
      icon: '🏠',
      description: 'Décoration et mobilier',
      link: '/products?category=home',
    },
    {
      name: 'Sport',
      icon: '⚽',
      description: 'Équipements sportifs',
      link: '/products?category=sports',
    },
  ];

  // Caractéristiques principales
  features = [
    {
      icon: '🚚',
      title: 'Livraison rapide',
      description: 'Livraison gratuite dès 50€',
    },
    {
      icon: '🔒',
      title: 'Paiement sécurisé',
      description: 'Transactions 100% sécurisées',
    },
    {
      icon: '↩️',
      title: 'Retours gratuits',
      description: "30 jours pour changer d'avis",
    },
    {
      icon: '💬',
      title: 'Support 24/7',
      description: 'Service client disponible',
    },
  ];

  featuredProducts$: Observable<ProductPage> | null = null;

  constructor(
    private authService: AuthService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.featuredProducts$ = this.productService.getProducts({
      size: 4,
      sort: 'id,desc',
    });
  }
}
