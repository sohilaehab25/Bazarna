import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AdminProduct,
  AdminProductCreateApi,
  AdminProductDetailApi,
  AdminProductsBulkActionApi,
  AdminProductsBulkActionPayload,
  AdminProductsBulkActionResult,
  AdminProductsCategoriesApi,
  AdminProductsQuery,
  AdminProductsResponse,
  AdminProductsResponseApi,
  AdminProductUpdateApi,
  CreateProductPayload,
  UpdateProductPayload,
} from './admin-products.contracts';
import { Category } from '../../../../../app.type';

@Injectable({
  providedIn: 'root',
})
export class AdminProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3009/api';

  getProducts(query: AdminProductsQuery): Observable<AdminProductsResponse> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize))
      .set('sortBy', query.sortBy)
      .set('sortOrder', query.sortOrder)
      .set('stockState', query.stockState)
      .set('status', query.status);

    if (query.search.trim().length > 0) {
      params = params.set('search', query.search.trim());
    }

    if (query.categoryId) {
      params = params.set('categoryId', query.categoryId);
    }

    return this.http
      .get<AdminProductsResponseApi>(`${this.apiUrl}/products/admin`, { params })
      .pipe(map((response) => response.data));
  }

  getProductById(id: string): Observable<AdminProduct> {
    return this.http
      .get<AdminProductDetailApi>(`${this.apiUrl}/products/${id}`)
      .pipe(map((response) => response.data));
  }

  createProduct(payload: CreateProductPayload): Observable<AdminProduct> {
    return this.http
      .post<AdminProductCreateApi>(`${this.apiUrl}/products`, payload)
      .pipe(map((response) => response.data));
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<AdminProduct> {
    return this.http
      .put<AdminProductUpdateApi>(`${this.apiUrl}/products/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  getCategories(): Observable<readonly Category[]> {
    return this.http
      .get<AdminProductsCategoriesApi>(`${this.apiUrl}/categories`)
      .pipe(map((response) => response.data ?? []));
  }

  runBulkAction(payload: AdminProductsBulkActionPayload): Observable<AdminProductsBulkActionResult> {
    return this.http
      .patch<AdminProductsBulkActionApi>(`${this.apiUrl}/products/bulk`, payload)
      .pipe(map((response) => response.data));
  }
}
