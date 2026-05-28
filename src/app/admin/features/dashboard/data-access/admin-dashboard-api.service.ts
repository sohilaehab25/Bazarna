import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Order, Product } from '../../../../../app.type';
import { DashboardUser } from './admin-dashboard.contracts';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3009/api';

  getOrders(): Observable<readonly Order[]> {
    return this.http
      .get<ApiResponse<Order[]>>(`${this.apiUrl}/orders`)
      .pipe(map((response) => response.data ?? []));
  }

  getProducts(): Observable<readonly Product[]> {
    return this.http
      .get<ApiResponse<Product[]>>(`${this.apiUrl}/products`, {
        params: {
          limit: '200',
          offset: '0',
        },
      })
      .pipe(map((response) => response.data ?? []));
  }

  getUsers(): Observable<readonly DashboardUser[]> {
    return this.http
      .get<ApiResponse<DashboardUser[]>>(`${this.apiUrl}/users`)
      .pipe(map((response) => response.data ?? []));
  }
}
