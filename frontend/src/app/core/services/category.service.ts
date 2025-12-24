import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id: number;
  name: string;
  description: string;
  parentId?: number;
  subCategories?: Category[];
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly API_URL =
    environment.apiBaseUrl + environment.categoryServiceUrl;

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.API_URL);
  }

  getRootCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API_URL}/root`);
  }
}
