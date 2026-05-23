import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, customerInfo, GuestCheckoutPayload, items, Order } from '../../../app.type';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3009/api/orders';

  private orders = signal<Order[]>([]);

  constructor() {
    this.loadOrders();
  }

  loadOrders() {
    if (!this.authService.isLoggedIn()) return;

    this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/my-orders`).subscribe({
      next: (res) => {
        if (res.success) {
          this.orders.set(this.sortOrders(res.data));
        }
      }
    });
  }

  checkout(paymentMethod: 'cash' | 'visa'): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/checkout`, { paymentMethod }).pipe(
      tap(res => {
        if (res.success) {
          this.orders.update(orders => this.sortOrders([res.data, ...orders]));
        }
      })
    );
  }

  guestCheckout(payload: GuestCheckoutPayload): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/guest-checkout`, payload);
  }

  getOrders() {
    return this.orders;
  }

  getOrderById(id: string) {
    return this.orders().find(order => order._id === id);
  }

  private sortOrders(orders: Order[]): Order[] {
    return [...orders].sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return secondTime - firstTime;
    });
  }
}