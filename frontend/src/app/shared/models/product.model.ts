/**src/app/shared/models/product.model.ts
 * Modèle produit
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number | null;
  categoryName: string | null;
  images?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string; 

}

/**
 * Catégorie de produit
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
}

/**
 * Page de produits (pagination)
 */
export interface ProductPage {
  content: Product[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Information de pagination
 */
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * Information de tri
 */
export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

/**
 * Filtres de recherche produits
 */
export interface ProductFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}
