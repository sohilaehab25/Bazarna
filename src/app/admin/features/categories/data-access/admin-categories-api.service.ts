import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AdminCategoriesQuery,
  AdminCategoriesResponse,
  AdminCategoriesResponseApi,
  AdminCategory,
  AdminCategoryApi,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from './admin-categories.contracts';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3009/api';

  getCategories(query: AdminCategoriesQuery): Observable<AdminCategoriesResponse> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize))
      .set('sortBy', query.sortBy)
      .set('sortOrder', query.sortOrder);

    if (query.search) params = params.set('search', query.search);
    if (query.featured !== undefined) params = params.set('featured', String(query.featured));

    return this.http
      .get<AdminCategoriesResponseApi>(`${this.apiUrl}/categories/admin`, { params })
      .pipe(map((res) => res.data));
  }

  createCategory(payload: CreateCategoryPayload): Observable<AdminCategory> {
    return this.http
      .post<AdminCategoryApi>(`${this.apiUrl}/categories`, payload)
      .pipe(map((res) => res.data));
  }

  updateCategory(id: string, payload: UpdateCategoryPayload): Observable<AdminCategory> {
    return this.http
      .put<AdminCategoryApi>(`${this.apiUrl}/categories/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }
}
