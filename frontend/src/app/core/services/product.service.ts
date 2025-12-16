import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  ProductPage,
  ProductFilters,
  Category,
} from '../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly PRODUCT_API = environment.productServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les produits avec pagination et filtres
   */
  getProducts(filters?: ProductFilters): Observable<ProductPage> {
    let params = new HttpParams();

    if (filters) {
      if (filters.categoryId)
        params = params.set('categoryId', filters.categoryId.toString());
      if (filters.minPrice)
        params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice)
        params = params.set('maxPrice', filters.maxPrice.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page !== undefined)
        params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sort) params = params.set('sort', filters.sort);
    }

    return this.http.get<ProductPage>(this.PRODUCT_API, { params });
  }

  /**
   * Récupérer un produit par son ID
   */
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.PRODUCT_API}/${id}`);
  }

  /**
   * Rechercher des produits par nom
   */
  searchProducts(
    query: string,
    page: number = 0,
    size: number = 10
  ): Observable<ProductPage> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ProductPage>(this.PRODUCT_API, { params });
  }

  /**
   * Récupérer les produits par catégorie
   */
  getProductsByCategory(
    categoryId: number,
    page: number = 0,
    size: number = 10
  ): Observable<ProductPage> {
    const params = new HttpParams()
      .set('categoryId', categoryId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ProductPage>(this.PRODUCT_API, { params });
  }

  /**
   * Récupérer les catégories disponibles
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(environment.categoryServiceUrl);
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
}
