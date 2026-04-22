import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from './products.service';
import { AuthService } from './auth.service';
import { tap } from 'rxjs';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BackendCartItem {
  productId: Product;
  quantity: number;
}

interface BackendCart {
  items: BackendCartItem[];
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3009/api/cart';

  private cartItems = signal<CartItem[]>([]);
  private totalPrice = signal<number>(0);

  cartItemsCount = computed(() => this.cartItems().reduce((total, item) => total + item.quantity, 0));
  cartTotal = computed(() => this.totalPrice());

  constructor() {
    this.loadCart();
  }

  loadCart() {
    if (!this.authService.isLoggedIn()) return;

    this.http.get<ApiResponse<BackendCart>>(this.apiUrl).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const items = res.data.items.map(item => ({
            product: item.productId,
            quantity: item.quantity
          }));
          this.cartItems.set(items);
          this.totalPrice.set(res.data.totalPrice);
        }
      }
    });
  }

  addToCart(product: Product, quantity: number = 1) {
    if (!this.authService.isLoggedIn()) return;

    // Optimistic update
    const currentItems = this.cartItems();
    const existingItem = currentItems.find(item => item.product._id === product._id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      this.cartItems.set([...currentItems]);
    } else {
      this.cartItems.set([...currentItems, { product, quantity }]);
    }

    this.http.post<ApiResponse<BackendCart>>(`${this.apiUrl}/add`, {
      productId: product._id,
      quantity
    }).subscribe({
      next: (res) => {
        if (res.success) this.syncCart(res.data);
      },
      error: () => this.loadCart() // Rollback on error
    });
  }

  updateQuantity(productId: string, quantity: number) {
    if (!this.authService.isLoggedIn()) return;

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    // Optimistic update
    const currentItems = this.cartItems();
    const item = currentItems.find(item => item.product._id === productId);
    if (item) {
      item.quantity = quantity;
      this.cartItems.set([...currentItems]);
    }

    this.http.post<ApiResponse<BackendCart>>(`${this.apiUrl}/update-quantity`, {
      productId,
      quantity
    }).subscribe({
      next: (res) => {
        if (res.success) this.syncCart(res.data);
      },
      error: () => this.loadCart() // Rollback on error
    });
  }

  removeFromCart(productId: string) {
    if (!this.authService.isLoggedIn()) return;

    // Optimistic update
    this.cartItems.set(this.cartItems().filter(item => item.product._id !== productId));

    this.http.delete<ApiResponse<BackendCart>>(`${this.apiUrl}/remove/${productId}`).subscribe({
      next: (res) => {
        if (res.success) this.syncCart(res.data);
      },
      error: () => this.loadCart() // Rollback on error
    });
  }

  clearCart() {
    this.cartItems.set([]);
    this.totalPrice.set(0);
  }

  private syncCart(data: BackendCart) {
    const items = data.items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }));
    this.cartItems.set(items);
    this.totalPrice.set(data.totalPrice);
  }

  getCartItems() {
    return this.cartItems;
  }
}