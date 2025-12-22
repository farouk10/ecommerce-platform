import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Product } from '../../../shared/models';
import {
  CategoryService,
  Category,
} from '../../../core/services/category.service';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products-admin.component.html',
})
export class ProductsAdminComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  searchTerm = '';

  // Bulk Selection
  selectedIds: Set<number> = new Set();

  // Sorting
  sortColumn: keyof Product | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  private readonly API_URL = `${environment.productServiceUrl}`;

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error('Error loading categories', err),
    });
  }

  loadProducts() {
    this.http.get<{ content: Product[] }>(this.API_URL).subscribe({
      next: (response) => {
        this.products = response.content || [];
        this.filterProducts();
      },
      error: (err) => console.error('Erreur loading products', err),
    });
  }

  filterProducts() {
    let temp = [...this.products];

    // 1. Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      temp = temp.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // 2. Sort
    if (this.sortColumn) {
      temp.sort((a, b) => {
        const valA = a[this.sortColumn as keyof Product];
        const valB = b[this.sortColumn as keyof Product];

        if (valA == null) return 1;
        if (valB == null) return -1;

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredProducts = temp;
  }

  // --- Sorting ---
  onSort(column: keyof Product) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterProducts();
  }

  // --- Bulk Selection ---
  toggleSelection(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.filteredProducts.forEach((p) => this.selectedIds.add(p.id));
    } else {
      this.selectedIds.clear();
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  isAllSelected(): boolean {
    return (
      this.filteredProducts.length > 0 &&
      this.filteredProducts.every((p) => this.selectedIds.has(p.id))
    );
  }

  // --- Actions ---
  getCategoryName(id?: number | null): string {
    if (!id) return 'Non classé';
    const cat = this.categories.find((c) => c.id === id);
    return cat ? cat.name : 'Inconnu';
  }

  deleteProduct(id: number) {
    if (confirm('Supprimer ce produit ?')) {
      this.http.delete(`${this.API_URL}/${id}`).subscribe(() => {
        this.selectedIds.delete(id);
        this.loadProducts();
      });
    }
  }

  deleteSelected() {
    if (this.selectedIds.size === 0) return;

    if (confirm(`Supprimer ${this.selectedIds.size} produits sélectionnés ?`)) {
      // Create array of delete observables
      const deleteRequests = Array.from(this.selectedIds).map((id) =>
        this.http.delete(`${this.API_URL}/${id}`)
      );

      // Execute all (forkJoin needs import, check imports first)
      // We will simple iterate for now to avoid import hell if rxjs not imported
      // Actually, let's use a simple loop logic or Promise.all
      // Using simpler approach for stability
      let completed = 0;
      this.selectedIds.forEach((id) => {
        this.http.delete(`${this.API_URL}/${id}`).subscribe(() => {
          completed++;
          if (completed === this.selectedIds.size) {
            this.selectedIds.clear();
            this.loadProducts();
          }
        });
      });
    }
  }
}
