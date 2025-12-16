import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductFilters, Category } from '../../../shared/models';
import { ProductCardComponent } from '../product-card/product-card.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductSkeletonComponent } from '../product-skeleton.component';

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    ProductSkeletonComponent,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  filteredCategories: Category[] = []; // Filtered list for display
  isLoading: boolean = false;
  errorMessage: string = '';

  // Pagination
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 12;

  // Filtres
  searchQuery: string = '';
  categorySearchQuery: string = ''; // New: Search within categories
  selectedCategoryId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: string = 'name';

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | undefined;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    // Debounce search
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query;
        this.currentPage = 0;
        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.filterCategories(); // Initial filter
      },
      error: (e) => console.error('Erreur chargement catégories', e),
    });
  }

  /**
   * Filter categories based on search input
   */
  filterCategories(): void {
    if (!this.categorySearchQuery) {
      this.filteredCategories = this.categories;
    } else {
      const term = this.categorySearchQuery.toLowerCase();
      this.filteredCategories = this.categories.filter((c) =>
        c.name.toLowerCase().includes(term)
      );
    }
  }

  /**
   * Charger les produits avec filtres
   */
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: ProductFilters = {
      page: this.currentPage,
      size: this.pageSize,
      sort: this.sortBy,
    };

    if (this.searchQuery) {
      filters.search = this.searchQuery;
    }
    if (this.selectedCategoryId) {
      filters.categoryId = this.selectedCategoryId;
    }
    if (this.minPrice != null) {
      filters.minPrice = this.minPrice;
    }
    if (this.maxPrice != null) {
      filters.maxPrice = this.maxPrice;
    }

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        this.products = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement produits:', error);
        this.errorMessage = 'Impossible de charger les produits.';
        this.isLoading = false;
        this.products = [];
      },
    });
  }

  /**
   * Rechercher des produits (Input Change)
   */
  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  /**
   * Trigger immediate search (Enter key)
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Filtrer par catégorie
   */
  onCategoryChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  onPriceChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Changer le tri
   */
  onSortChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategoryId = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'name';
    this.currentPage = 0;
    this.loadProducts();
  }

  /**
   * Pagination - page suivante
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Pagination - page précédente
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Aller à une page spécifique
   */
  goToPage(page: number): void {
    this.currentPage = page;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Générer le tableau de numéros de pages
   */
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
