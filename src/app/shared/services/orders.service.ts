import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Order {
  _id: string;
  items: {
    productId: any;
    quantity: number;
  }[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'delivered';
  paymentMethod: 'cash' | 'visa';
  createdAt: Date;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

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
          this.orders.set(res.data);
        }
      }
    });
  }

  checkout(paymentMethod: 'cash' | 'visa'): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.apiUrl}/checkout`, { paymentMethod }).pipe(
      tap(res => {
        if (res.success) {
          this.orders.update(orders => [res.data, ...orders]);
        }
      })
    );
  }

  getOrders() {
    return this.orders;
  }

  getOrderById(id: string) {
    return this.orders().find(order => order._id === id);
  }
}