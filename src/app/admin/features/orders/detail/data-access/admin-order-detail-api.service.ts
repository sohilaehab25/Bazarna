import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AdminOrderDetail,
  AdminOrderDetailResponseApi,
} from './admin-order-detail.contracts';
import { AdminOrderStatus } from '../../data-access/admin-orders.contracts';

@Injectable({
  providedIn: 'root',
})
export class AdminOrderDetailApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3009/api';

  getDetail(id: string): Observable<AdminOrderDetail> {
    return this.http
      .get<AdminOrderDetailResponseApi>(`${this.apiUrl}/orders/${id}`)
      .pipe(map((r) => r.data));
  }

  updateStatus(id: string, status: AdminOrderStatus, reason?: string): Observable<AdminOrderDetail> {
    return this.http
      .put<AdminOrderDetailResponseApi>(`${this.apiUrl}/orders/${id}/status`, { status, reason })
      .pipe(map((r) => r.data));
  }

  addNote(id: string, body: string): Observable<AdminOrderDetail> {
    return this.http
      .post<AdminOrderDetailResponseApi>(`${this.apiUrl}/orders/${id}/notes`, { body })
      .pipe(map((r) => r.data));
  }
}
