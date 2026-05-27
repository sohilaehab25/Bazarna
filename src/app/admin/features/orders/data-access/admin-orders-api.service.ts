import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AdminOrdersQuery,
  AdminOrdersResponse,
  AdminOrdersResponseApi,
} from './admin-orders.contracts';

@Injectable({
  providedIn: 'root',
})
export class AdminOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3009/api';

  getOrders(query: AdminOrdersQuery): Observable<AdminOrdersResponse> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize))
      .set('sortBy', query.sortBy)
      .set('sortOrder', query.sortOrder)
      .set('status', query.status)
      .set('paymentMethod', query.paymentMethod);

    if (query.search.trim().length > 0) {
      params = params.set('search', query.search.trim());
    }

    if (query.dateFrom) {
      params = params.set('dateFrom', query.dateFrom);
    }

    if (query.dateTo) {
      params = params.set('dateTo', query.dateTo);
    }

    if (query.minRevenue) {
      params = params.set('minRevenue', query.minRevenue);
    }

    if (query.maxRevenue) {
      params = params.set('maxRevenue', query.maxRevenue);
    }

    return this.http
      .get<AdminOrdersResponseApi>(`${this.apiUrl}/orders/admin`, { params })
      .pipe(map((response) => response.data));
  }
}
